import {
  Injectable, NotFoundException, ConflictException,
  BadRequestException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { parse } from 'csv-parse/sync';
import { Tower } from './entities/tower.entity';
import { Floor } from './entities/floor.entity';
import { Unit } from './entities/unit.entity';
import { CreateTowerDto, UpdateTowerDto } from './dto/tower.dto';
import { CreateFloorDto, UpdateFloorDto } from './dto/floor.dto';
import { CreateUnitDto, UpdateUnitDto } from './dto/unit.dto';
import { SocietiesService } from '../societies/societies.service';
import { UnitType } from '../../common/enums/unit-type.enum';

@Injectable()
export class StructureService {
  private readonly logger = new Logger(StructureService.name);

  constructor(
    @InjectRepository(Tower) private readonly towersRepo: Repository<Tower>,
    @InjectRepository(Floor) private readonly floorsRepo: Repository<Floor>,
    @InjectRepository(Unit) private readonly unitsRepo: Repository<Unit>,
    private readonly societiesService: SocietiesService,
  ) {}

  // ─── Towers ───────────────────────────────────────────────────────────────

  async createTower(societyId: string, dto: CreateTowerDto): Promise<Tower> {
    const tower = this.towersRepo.create({ ...dto, societyId });
    const saved = await this.towersRepo.save(tower);
    await this.societiesService.incrementTowerCount(societyId);
    this.logger.log(`Tower created: ${saved.id} in society ${societyId}`);
    return saved;
  }

  async findAllTowers(societyId: string): Promise<Tower[]> {
    return this.towersRepo.find({ where: { societyId }, order: { name: 'ASC' } });
  }

  async findOneTower(societyId: string, towerId: string): Promise<Tower> {
    const tower = await this.towersRepo.findOne({ where: { id: towerId, societyId } });
    if (!tower) throw new NotFoundException(`Tower ${towerId} not found`);
    return tower;
  }

  async updateTower(societyId: string, towerId: string, dto: UpdateTowerDto): Promise<Tower> {
    const tower = await this.findOneTower(societyId, towerId);
    Object.assign(tower, dto);
    return this.towersRepo.save(tower);
  }

  async removeTower(societyId: string, towerId: string): Promise<void> {
    const tower = await this.findOneTower(societyId, towerId);
    await this.towersRepo.softRemove(tower);
    await this.societiesService.decrementTowerCount(societyId);
  }

  // ─── Floors ───────────────────────────────────────────────────────────────

  async createFloor(societyId: string, dto: CreateFloorDto): Promise<Floor> {
    await this.findOneTower(societyId, dto.towerId);
    const existing = await this.floorsRepo.findOne({
      where: { towerId: dto.towerId, floorNumber: dto.floorNumber },
    });
    if (existing) {
      throw new ConflictException(`Floor ${dto.floorNumber} already exists in this tower`);
    }
    const floor = this.floorsRepo.create({ ...dto, societyId });
    return this.floorsRepo.save(floor);
  }

  async findAllFloors(societyId: string, towerId?: string): Promise<Floor[]> {
    const where = towerId ? { societyId, towerId } : { societyId };
    return this.floorsRepo.find({ where, order: { floorNumber: 'ASC' } });
  }

  async findOneFloor(societyId: string, floorId: string): Promise<Floor> {
    const floor = await this.floorsRepo.findOne({ where: { id: floorId, societyId } });
    if (!floor) throw new NotFoundException(`Floor ${floorId} not found`);
    return floor;
  }

  async updateFloor(societyId: string, floorId: string, dto: UpdateFloorDto): Promise<Floor> {
    const floor = await this.findOneFloor(societyId, floorId);
    Object.assign(floor, dto);
    return this.floorsRepo.save(floor);
  }

  // ─── Units ────────────────────────────────────────────────────────────────

  async createUnit(societyId: string, dto: CreateUnitDto): Promise<Unit> {
    await this.findOneTower(societyId, dto.towerId);
    await this.findOneFloor(societyId, dto.floorId);

    const existing = await this.unitsRepo.findOne({
      where: { societyId, towerId: dto.towerId, unitNumber: dto.unitNumber },
    });
    if (existing) {
      throw new ConflictException(`Unit "${dto.unitNumber}" already exists in this tower`);
    }

    const unit = this.unitsRepo.create({ ...dto, societyId });
    const saved = await this.unitsRepo.save(unit);
    await this.societiesService.incrementUnitCount(societyId);
    return saved;
  }

  async findAllUnits(
    societyId: string,
    filters?: { towerId?: string; status?: string; type?: string },
  ): Promise<Unit[]> {
    const where: Record<string, unknown> = { societyId };
    if (filters?.towerId) where.towerId = filters.towerId;
    if (filters?.status) where.status = filters.status;
    if (filters?.type) where.type = filters.type;
    return this.unitsRepo.find({ where, order: { unitNumber: 'ASC' } });
  }

  async findOneUnit(societyId: string, unitId: string): Promise<Unit> {
    const unit = await this.unitsRepo.findOne({
      where: { id: unitId, societyId },
      relations: ['tower', 'floor'],
    });
    if (!unit) throw new NotFoundException(`Unit ${unitId} not found`);
    return unit;
  }

  /** Internal lookup — used by other services (no auth check) */
  async findUnitById(unitId: string): Promise<Unit> {
    const unit = await this.unitsRepo.findOne({ where: { id: unitId } });
    if (!unit) throw new NotFoundException(`Unit ${unitId} not found`);
    return unit;
  }

  async updateUnit(societyId: string, unitId: string, dto: UpdateUnitDto): Promise<Unit> {
    const unit = await this.findOneUnit(societyId, unitId);
    Object.assign(unit, dto);
    return this.unitsRepo.save(unit);
  }

  async removeUnit(societyId: string, unitId: string): Promise<void> {
    const unit = await this.findOneUnit(societyId, unitId);
    await this.unitsRepo.softRemove(unit);
    await this.societiesService.decrementUnitCount(societyId);
  }

  // ─── CSV Bulk Import (STRICT mode) ────────────────────────────────────────

  /**
   * Bulk import units from CSV.
   * CSV columns (required): tower_name, floor_number, unit_number, type
   * CSV columns (optional): sq_ft, bedrooms, bathrooms
   *
   * Strict mode: any row error fails the ENTIRE import (no partial saves).
   */
  async bulkImportUnits(
    societyId: string,
    csvBuffer: Buffer,
  ): Promise<{ imported: number; rows: Unit[] }> {
    const validTypes = Object.values(UnitType);

    let records: Record<string, string>[];
    try {
      records = parse(csvBuffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as Record<string, string>[];
    } catch (err) {
      throw new BadRequestException(`CSV parse error: ${(err as Error).message}`);
    }

    if (records.length === 0) {
      throw new BadRequestException('CSV file is empty');
    }

    const requiredCols = ['tower_name', 'floor_number', 'unit_number', 'type'];
    const firstRow = records[0];
    for (const col of requiredCols) {
      if (!(col in firstRow)) {
        throw new BadRequestException(
          `Missing required CSV column: "${col}". Required: ${requiredCols.join(', ')}`,
        );
      }
    }

    // Load all towers for this society (for name → id mapping)
    const towers = await this.towersRepo.find({ where: { societyId } });
    const towerMap = new Map(towers.map(t => [t.name.toLowerCase(), t]));

    const errors: string[] = [];
    const unitBuilders: Array<() => Promise<Unit>> = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2; // +1 for header, +1 for 1-indexing

      const towerName = row.tower_name?.trim();
      const floorNumberRaw = row.floor_number?.trim();
      const unitNumber = row.unit_number?.trim();
      const type = row.type?.trim().toLowerCase();

      if (!towerName) errors.push(`Row ${rowNum}: tower_name is required`);
      if (!floorNumberRaw) errors.push(`Row ${rowNum}: floor_number is required`);
      if (!unitNumber) errors.push(`Row ${rowNum}: unit_number is required`);
      if (!type) errors.push(`Row ${rowNum}: type is required`);

      if (!validTypes.includes(type as UnitType)) {
        errors.push(`Row ${rowNum}: invalid type "${type}". Valid: ${validTypes.join(', ')}`);
      }

      const floorNumber = parseInt(floorNumberRaw, 10);
      if (isNaN(floorNumber)) {
        errors.push(`Row ${rowNum}: floor_number must be an integer`);
      }

      const tower = towerName ? towerMap.get(towerName.toLowerCase()) : undefined;
      if (towerName && !tower) {
        errors.push(`Row ${rowNum}: tower "${towerName}" not found in this society`);
      }

      if (errors.length > 0) continue; // collect all errors before throwing

      unitBuilders.push(async () => {
        // Find or create the floor
        let floor = await this.floorsRepo.findOne({
          where: { towerId: tower!.id, floorNumber },
        });
        if (!floor) {
          floor = await this.floorsRepo.save(
            this.floorsRepo.create({ societyId, towerId: tower!.id, floorNumber }),
          );
        }

        // Check for duplicate unit
        const dup = await this.unitsRepo.findOne({
          where: { societyId, towerId: tower!.id, unitNumber },
        });
        if (dup) {
          errors.push(`Row ${rowNum}: unit "${unitNumber}" already exists in tower "${towerName}"`);
          return dup;
        }

        const sqFt = row.sq_ft ? parseFloat(row.sq_ft) : null;
        const bedrooms = row.bedrooms ? parseInt(row.bedrooms, 10) : null;
        const bathrooms = row.bathrooms ? parseInt(row.bathrooms, 10) : null;

        return this.unitsRepo.create({
          societyId,
          towerId: tower!.id,
          floorId: floor.id,
          unitNumber,
          type: type as UnitType,
          sqFt: sqFt && !isNaN(sqFt) ? sqFt : null,
          bedrooms: bedrooms && !isNaN(bedrooms) ? bedrooms : null,
          bathrooms: bathrooms && !isNaN(bathrooms) ? bathrooms : null,
        });
      });
    }

    if (errors.length > 0) {
      throw new BadRequestException({ message: 'CSV validation failed', errors });
    }

    // Save all floors and units within an isolated atomic database transaction
    const saved = await this.unitsRepo.manager.transaction(async (manager) => {
      const units: Unit[] = [];
      for (const builder of unitBuilders) {
        units.push(await builder());
      }

      if (errors.length > 0) {
        throw new BadRequestException({ message: 'CSV validation failed', errors });
      }

      const savedUnits = await manager.save(Unit, units);

      await manager
        .createQueryBuilder()
        .update('societies')
        .set({ totalUnits: () => `total_units + ${savedUnits.length}` })
        .where('id = :id', { id: societyId })
        .execute();

      return savedUnits;
    });

    this.logger.log(`Bulk imported ${saved.length} units into society ${societyId}`);
    return { imported: saved.length, rows: saved };
  }
}
