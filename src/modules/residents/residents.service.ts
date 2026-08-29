import {
  Injectable, NotFoundException, ConflictException,
  ForbiddenException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resident } from './entities/resident.entity';
import { FamilyMember } from './entities/family-member.entity';
import {
  CreateResidentDto, UpdateResidentDto,
  CreateFamilyMemberDto, UpdateFamilyMemberDto,
} from './dto/resident.dto';
import { StructureService } from '../structure/structure.service';
import { UnitStatus } from '../../common/enums/unit-type.enum';
import { ResidentType } from '../../common/enums/resident-type.enum';

@Injectable()
export class ResidentsService {
  private readonly logger = new Logger(ResidentsService.name);

  constructor(
    @InjectRepository(Resident) private readonly residentsRepo: Repository<Resident>,
    @InjectRepository(FamilyMember) private readonly familyRepo: Repository<FamilyMember>,
    private readonly structureService: StructureService,
  ) {}

  // ─── Residents ────────────────────────────────────────────────────────────

  async create(societyId: string, dto: CreateResidentDto): Promise<Resident> {
    // Verify unit exists in this society
    const unit = await this.structureService.findOneUnit(societyId, dto.unitId);

    // Check no duplicate resident for this user in this society
    const existing = await this.residentsRepo.findOne({
      where: { userId: dto.userId, societyId },
    });
    if (existing) {
      throw new ConflictException('This user is already registered as a resident in this society');
    }

    const resident = this.residentsRepo.create({
      ...dto,
      societyId,
      moveInDate: dto.moveInDate ? new Date(dto.moveInDate) : null,
      leaseStartDate: dto.leaseStartDate ? new Date(dto.leaseStartDate) : null,
      leaseEndDate: dto.leaseEndDate ? new Date(dto.leaseEndDate) : null,
    });

    const saved = await this.residentsRepo.save(resident);

    // Mark unit as occupied and set ownerUserId if owner
    const updates: Partial<typeof unit> = { status: UnitStatus.OCCUPIED };
    if (dto.type === ResidentType.OWNER) {
      (updates as Record<string, unknown>).ownerUserId = dto.userId;
    }
    await this.structureService.updateUnit(societyId, dto.unitId, updates as Parameters<typeof this.structureService.updateUnit>[2]);

    this.logger.log(`Resident created: ${saved.id} for unit ${dto.unitId}`);
    return saved;
  }

  async findAll(societyId: string): Promise<Resident[]> {
    return this.residentsRepo.find({
      where: { societyId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(societyId: string, residentId: string): Promise<Resident> {
    const resident = await this.residentsRepo.findOne({
      where: { id: residentId, societyId },
    });
    if (!resident) throw new NotFoundException(`Resident ${residentId} not found`);
    return resident;
  }

  async findByUnit(societyId: string, unitId: string): Promise<Resident | null> {
    return this.residentsRepo.findOne({
      where: { societyId, unitId, isActive: true },
    });
  }

  /** Internal — find resident by userId for notification purposes */
  async findByUserId(userId: string): Promise<Resident | null> {
    return this.residentsRepo.findOne({ where: { userId, isActive: true } });
  }

  async update(societyId: string, residentId: string, dto: UpdateResidentDto): Promise<Resident> {
    const resident = await this.findOne(societyId, residentId);
    Object.assign(resident, {
      ...dto,
      moveInDate: dto.moveInDate ? new Date(dto.moveInDate) : resident.moveInDate,
      moveOutDate: dto.moveOutDate ? new Date(dto.moveOutDate) : resident.moveOutDate,
      leaseStartDate: dto.leaseStartDate ? new Date(dto.leaseStartDate) : resident.leaseStartDate,
      leaseEndDate: dto.leaseEndDate ? new Date(dto.leaseEndDate) : resident.leaseEndDate,
    });
    return this.residentsRepo.save(resident);
  }

  async remove(societyId: string, residentId: string): Promise<void> {
    const resident = await this.findOne(societyId, residentId);
    resident.isActive = false;
    resident.moveOutDate = new Date();
    await this.residentsRepo.save(resident);
    // Mark unit as vacant
    await this.structureService.updateUnit(societyId, resident.unitId, {
      status: UnitStatus.VACANT,
    });
    this.logger.log(`Resident deactivated: ${residentId}`);
  }

  /** Directory — public-facing list with limited fields */
  async getDirectory(societyId: string): Promise<Resident[]> {
    return this.residentsRepo.find({
      where: { societyId, isActive: true },
      order: { createdAt: 'ASC' },
    });
  }

  // ─── Family Members ───────────────────────────────────────────────────────

  async addFamilyMember(
    societyId: string,
    residentId: string,
    dto: CreateFamilyMemberDto,
  ): Promise<FamilyMember> {
    await this.findOne(societyId, residentId);
    const member = this.familyRepo.create({
      ...dto,
      residentId,
      societyId,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
    });
    return this.familyRepo.save(member);
  }

  async findFamilyMembers(societyId: string, residentId: string): Promise<FamilyMember[]> {
    await this.findOne(societyId, residentId);
    return this.familyRepo.find({ where: { residentId } });
  }

  async updateFamilyMember(
    societyId: string,
    residentId: string,
    memberId: string,
    dto: UpdateFamilyMemberDto,
  ): Promise<FamilyMember> {
    await this.findOne(societyId, residentId);
    const member = await this.familyRepo.findOne({ where: { id: memberId, residentId } });
    if (!member) throw new NotFoundException(`Family member ${memberId} not found`);
    Object.assign(member, {
      ...dto,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : member.dateOfBirth,
    });
    return this.familyRepo.save(member);
  }

  async removeFamilyMember(
    societyId: string,
    residentId: string,
    memberId: string,
  ): Promise<void> {
    await this.findOne(societyId, residentId);
    const member = await this.familyRepo.findOne({ where: { id: memberId, residentId } });
    if (!member) throw new NotFoundException(`Family member ${memberId} not found`);
    await this.familyRepo.softRemove(member);
  }
}
