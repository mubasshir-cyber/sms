import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Society } from './entities/society.entity';
import { CreateSocietyDto } from './dto/create-society.dto';
import { UpdateSocietyDto } from './dto/update-society.dto';
import { TenantsService } from '../tenants/tenants.service';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class SocietiesService {
  private readonly logger = new Logger(SocietiesService.name);

  constructor(
    @InjectRepository(Society)
    private readonly societiesRepo: Repository<Society>,
    private readonly tenantsService: TenantsService,
  ) {}

  // ─── Create ───────────────────────────────────────────────────────────────

  async create(dto: CreateSocietyDto, requestingUser: AuthUser): Promise<Society> {
    this.logger.log(`Creating society: ${dto.slug} by ${requestingUser.sub}`);

    // SOCIETY_ADMIN can only create societies for their own tenant
    if (
      requestingUser.role !== Role.SUPER_ADMIN &&
      requestingUser.role !== Role.SOCIETY_ADMIN
    ) {
      throw new ForbiddenException('Only SUPER_ADMIN or SOCIETY_ADMIN can create societies');
    }

    // Verify the target tenant exists and is active
    await this.tenantsService.findOne(dto.tenantId);

    // Check tenant's society capacity limit
    const existingCount = await this.societiesRepo.count({
      where: { tenantId: dto.tenantId },
    });
    const canAdd = await this.tenantsService.canAddSociety(dto.tenantId, existingCount);
    if (!canAdd) {
      throw new ForbiddenException(
        'Tenant has reached their maximum society limit. Please upgrade the plan.',
      );
    }

    // Check slug uniqueness
    const existingBySlug = await this.societiesRepo.findOne({
      where: { slug: dto.slug },
    });
    if (existingBySlug) {
      throw new ConflictException(`A society with slug "${dto.slug}" already exists`);
    }

    const society = this.societiesRepo.create({
      ...dto,
      contactEmail: dto.contactEmail ? dto.contactEmail.toLowerCase() : null,
      timezone: dto.timezone ?? 'Asia/Kolkata',
    });

    const saved = await this.societiesRepo.save(society);
    this.logger.log(`Society created: ${saved.id} (${saved.slug})`);
    return saved;
  }

  // ─── Read ─────────────────────────────────────────────────────────────────

  async findAll(requestingUser: AuthUser): Promise<Society[]> {
    // SUPER_ADMIN sees all societies; others see only their society
    if (requestingUser.role === Role.SUPER_ADMIN) {
      return this.societiesRepo.find({
        relations: ['tenant'],
        order: { createdAt: 'DESC' },
      });
    }

    if (!requestingUser.societyId) {
      return [];
    }

    return this.societiesRepo.find({
      where: { id: requestingUser.societyId },
      relations: ['tenant'],
    });
  }

  async findOne(id: string, requestingUser: AuthUser): Promise<Society> {
    const where =
      requestingUser.role === Role.SUPER_ADMIN
        ? { id }
        : { id: requestingUser.societyId as string };

    const society = await this.societiesRepo.findOne({
      where: { id },
      relations: ['tenant'],
    });

    if (!society) {
      throw new NotFoundException(`Society ${id} not found`);
    }

    // Non-SUPER_ADMIN can only view their own society
    if (
      requestingUser.role !== Role.SUPER_ADMIN &&
      society.id !== requestingUser.societyId
    ) {
      throw new ForbiddenException('You do not have access to this society');
    }

    return society;
  }

  /**
   * Internal find — used by other services (billing, residents, etc.)
   * No auth check — caller is responsible for ensuring authorization.
   */
  async findOneInternal(id: string): Promise<Society> {
    const society = await this.societiesRepo.findOne({ where: { id } });
    if (!society) {
      throw new NotFoundException(`Society ${id} not found`);
    }
    return society;
  }

  // ─── Update ───────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateSocietyDto, requestingUser: AuthUser): Promise<Society> {
    const society = await this.findOne(id, requestingUser);

    // Only SUPER_ADMIN or SOCIETY_ADMIN of this society can update
    if (
      requestingUser.role !== Role.SUPER_ADMIN &&
      society.id !== requestingUser.societyId
    ) {
      throw new ForbiddenException('You cannot update this society');
    }

    // If slug is changing, check uniqueness
    if (dto.slug && dto.slug !== society.slug) {
      const existing = await this.societiesRepo.findOne({ where: { slug: dto.slug } });
      if (existing) {
        throw new ConflictException(`A society with slug "${dto.slug}" already exists`);
      }
    }

    if (dto.contactEmail) {
      dto.contactEmail = dto.contactEmail.toLowerCase();
    }

    Object.assign(society, dto);
    const updated = await this.societiesRepo.save(society);
    this.logger.log(`Society updated: ${id} by ${requestingUser.sub}`);
    return updated;
  }

  // ─── Delete (Soft) ────────────────────────────────────────────────────────

  async remove(id: string, requestingUser: AuthUser): Promise<void> {
    if (requestingUser.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can delete a society');
    }
    const society = await this.findOne(id, requestingUser);
    await this.societiesRepo.softRemove(society);
    this.logger.log(`Society soft-deleted: ${id} by ${requestingUser.sub}`);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  /**
   * Increment totalTowers count.
   * Called by the Society Structure module when a tower is added.
   */
  async incrementTowerCount(societyId: string): Promise<void> {
    await this.societiesRepo.increment({ id: societyId }, 'totalTowers', 1);
  }

  /**
   * Decrement totalTowers count.
   */
  async decrementTowerCount(societyId: string): Promise<void> {
    await this.societiesRepo.decrement({ id: societyId }, 'totalTowers', 1);
  }

  /**
   * Increment totalUnits count.
   * Called by the Society Structure module when a unit is added.
   */
  async incrementUnitCount(societyId: string): Promise<void> {
    await this.societiesRepo.increment({ id: societyId }, 'totalUnits', 1);
  }

  /**
   * Decrement totalUnits count.
   */
  async decrementUnitCount(societyId: string): Promise<void> {
    await this.societiesRepo.decrement({ id: societyId }, 'totalUnits', 1);
  }
}
