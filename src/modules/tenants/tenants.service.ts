import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { PLAN_MAX_SOCIETIES } from '../../common/enums/plan.enum';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantsRepo: Repository<Tenant>,
  ) {}

  // ─── Create ───────────────────────────────────────────────────────────────

  async create(dto: CreateTenantDto): Promise<Tenant> {
    this.logger.log(`Creating tenant: ${dto.slug}`);

    // Check slug uniqueness
    const existingBySlug = await this.tenantsRepo.findOne({
      where: { slug: dto.slug },
    });
    if (existingBySlug) {
      throw new ConflictException(`A tenant with slug "${dto.slug}" already exists`);
    }

    // Check email uniqueness
    const existingByEmail = await this.tenantsRepo.findOne({
      where: { contactEmail: dto.contactEmail.toLowerCase() },
    });
    if (existingByEmail) {
      throw new ConflictException(`A tenant with email "${dto.contactEmail}" already exists`);
    }

    // If maxSocieties not provided, derive from plan
    const plan = dto.plan ?? 'free' as Tenant['plan'];
    const maxSocieties = dto.maxSocieties ?? PLAN_MAX_SOCIETIES[plan];

    const tenant = this.tenantsRepo.create({
      ...dto,
      contactEmail: dto.contactEmail.toLowerCase(),
      plan,
      maxSocieties,
      planExpiresAt: dto.planExpiresAt ? new Date(dto.planExpiresAt) : null,
    });

    const saved = await this.tenantsRepo.save(tenant);
    this.logger.log(`Tenant created: ${saved.id} (${saved.slug})`);
    return saved;
  }

  // ─── Read ─────────────────────────────────────────────────────────────────

  async findAll(): Promise<Tenant[]> {
    return this.tenantsRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantsRepo.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException(`Tenant ${id} not found`);
    }
    return tenant;
  }

  async findBySlug(slug: string): Promise<Tenant> {
    const tenant = await this.tenantsRepo.findOne({ where: { slug } });
    if (!tenant) {
      throw new NotFoundException(`Tenant with slug "${slug}" not found`);
    }
    return tenant;
  }

  // ─── Update ───────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findOne(id);

    // If slug is changing, check uniqueness
    if (dto.slug && dto.slug !== tenant.slug) {
      const existing = await this.tenantsRepo.findOne({ where: { slug: dto.slug } });
      if (existing) {
        throw new ConflictException(`A tenant with slug "${dto.slug}" already exists`);
      }
    }

    // If email is changing, check uniqueness
    if (dto.contactEmail && dto.contactEmail.toLowerCase() !== tenant.contactEmail) {
      const existing = await this.tenantsRepo.findOne({
        where: { contactEmail: dto.contactEmail.toLowerCase() },
      });
      if (existing) {
        throw new ConflictException(`A tenant with email "${dto.contactEmail}" already exists`);
      }
      dto.contactEmail = dto.contactEmail.toLowerCase();
    }

    // Recalculate maxSocieties if plan changes and maxSocieties not explicitly set
    if (dto.plan && !dto.maxSocieties) {
      dto.maxSocieties = PLAN_MAX_SOCIETIES[dto.plan];
    }

    Object.assign(tenant, dto);
    if (dto.planExpiresAt) {
      tenant.planExpiresAt = new Date(dto.planExpiresAt);
    }

    const updated = await this.tenantsRepo.save(tenant);
    this.logger.log(`Tenant updated: ${id}`);
    return updated;
  }

  // ─── Delete (Soft) ────────────────────────────────────────────────────────

  async remove(id: string): Promise<void> {
    const tenant = await this.findOne(id);
    await this.tenantsRepo.softRemove(tenant);
    this.logger.log(`Tenant soft-deleted: ${id}`);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  /**
   * Check if a tenant has reached their society creation limit.
   * Called by SocietiesService before creating a new society.
   */
  async canAddSociety(tenantId: string, currentSocietyCount: number): Promise<boolean> {
    const tenant = await this.findOne(tenantId);
    if (!tenant.isActive) {
      throw new BadRequestException('Tenant account is not active');
    }
    return currentSocietyCount < tenant.maxSocieties;
  }
}
