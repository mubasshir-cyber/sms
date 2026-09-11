import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Asset } from './entities/asset.entity';
import { AssetMaintenanceLog } from './entities/asset-maintenance-log.entity';
import { AssetMaintenanceSchedule } from './entities/asset-maintenance-schedule.entity';
import { AssetDepreciationLog } from './entities/asset-depreciation-log.entity';
import {
  CreateAssetDto,
  UpdateAssetDto,
  DisposeAssetDto,
  AssetFilterDto,
  CreateMaintenanceLogDto,
  UpdateMaintenanceLogDto,
  CreateMaintenanceScheduleDto,
  UpdateMaintenanceScheduleDto,
  RecordDepreciationDto,
} from './dto/assets.dto';
import { AssetStatus, MaintenanceLogStatus } from '../../common/enums/asset.enum';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationChannel } from '../../common/enums/notification.enum';

@Injectable()
export class AssetsService {
  private readonly logger = new Logger(AssetsService.name);

  constructor(
    @InjectRepository(Asset)
    private readonly assetsRepo: Repository<Asset>,
    @InjectRepository(AssetMaintenanceLog)
    private readonly maintenanceLogsRepo: Repository<AssetMaintenanceLog>,
    @InjectRepository(AssetMaintenanceSchedule)
    private readonly schedulesRepo: Repository<AssetMaintenanceSchedule>,
    @InjectRepository(AssetDepreciationLog)
    private readonly depreciationLogsRepo: Repository<AssetDepreciationLog>,
    private readonly notificationsService: NotificationsService,
  ) {}

  private getSocietyId(user: AuthUser): string {
    if (!user.societyId && user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('User is not associated with any society');
    }
    return user.societyId as string;
  }

  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏗️ ASSETS
  // ═══════════════════════════════════════════════════════════════════════════

  async createAsset(user: AuthUser, dto: CreateAssetDto): Promise<Asset> {
    const societyId = this.getSocietyId(user);

    const asset = this.assetsRepo.create({
      societyId,
      category: dto.category,
      name: dto.name,
      model: dto.model ?? null,
      manufacturer: dto.manufacturer ?? null,
      serialNumber: dto.serialNumber ?? null,
      location: dto.location,
      purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
      purchaseCost: dto.purchaseCost != null ? this.round2(dto.purchaseCost) : null,
      // Initial current value equals purchase cost
      currentValue: dto.purchaseCost != null ? this.round2(dto.purchaseCost) : null,
      warrantyExpiryDate: dto.warrantyExpiryDate ? new Date(dto.warrantyExpiryDate) : null,
      amcVendorId: dto.amcVendorId ?? null,
      amcContractId: dto.amcContractId ?? null,
      amcExpiryDate: dto.amcExpiryDate ? new Date(dto.amcExpiryDate) : null,
      photoUrls: dto.photoUrls ?? null,
      notes: dto.notes ?? null,
    });

    return this.assetsRepo.save(asset);
  }

  async findAllAssets(user: AuthUser, filter: AssetFilterDto): Promise<Asset[]> {
    const societyId = this.getSocietyId(user);
    const where: Record<string, unknown> = { societyId };
    if (filter.category) where['category'] = filter.category;
    if (filter.status) where['status'] = filter.status;

    return this.assetsRepo.find({
      where,
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  async findAssetById(user: AuthUser, id: string): Promise<Asset> {
    const societyId = this.getSocietyId(user);
    const asset = await this.assetsRepo.findOne({
      where: { id, societyId },
      relations: ['maintenanceLogs', 'maintenanceSchedules', 'depreciationLogs'],
    });
    if (!asset) {
      throw new NotFoundException(`Asset ${id} not found`);
    }
    return asset;
  }

  async updateAsset(user: AuthUser, id: string, dto: UpdateAssetDto): Promise<Asset> {
    const asset = await this.findAssetById(user, id);

    if (asset.status === AssetStatus.DISPOSED) {
      throw new BadRequestException('Cannot update a disposed asset');
    }

    Object.assign(asset, {
      ...(dto.category !== undefined && { category: dto.category }),
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.model !== undefined && { model: dto.model }),
      ...(dto.manufacturer !== undefined && { manufacturer: dto.manufacturer }),
      ...(dto.serialNumber !== undefined && { serialNumber: dto.serialNumber }),
      ...(dto.location !== undefined && { location: dto.location }),
      ...(dto.purchaseDate !== undefined && { purchaseDate: new Date(dto.purchaseDate) }),
      ...(dto.purchaseCost !== undefined && { purchaseCost: this.round2(dto.purchaseCost) }),
      ...(dto.warrantyExpiryDate !== undefined && {
        warrantyExpiryDate: dto.warrantyExpiryDate ? new Date(dto.warrantyExpiryDate) : null,
      }),
      ...(dto.amcVendorId !== undefined && { amcVendorId: dto.amcVendorId }),
      ...(dto.amcContractId !== undefined && { amcContractId: dto.amcContractId }),
      ...(dto.amcExpiryDate !== undefined && {
        amcExpiryDate: dto.amcExpiryDate ? new Date(dto.amcExpiryDate) : null,
      }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.photoUrls !== undefined && { photoUrls: dto.photoUrls }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
    });

    return this.assetsRepo.save(asset);
  }

  async disposeAsset(user: AuthUser, id: string, dto: DisposeAssetDto): Promise<Asset> {
    const asset = await this.findAssetById(user, id);

    if (asset.status === AssetStatus.DISPOSED) {
      throw new BadRequestException('Asset is already disposed');
    }

    asset.status = AssetStatus.DISPOSED;
    asset.disposalDate = new Date(dto.disposalDate);
    asset.disposalValue = dto.disposalValue != null ? this.round2(dto.disposalValue) : null;
    if (dto.notes) asset.notes = dto.notes;

    // Deactivate all running schedules for this asset
    await this.schedulesRepo.update(
      { assetId: id, isActive: true },
      { isActive: false },
    );

    this.logger.log(`Asset ${id} (${asset.name}) disposed on ${dto.disposalDate}`);
    return this.assetsRepo.save(asset);
  }

  async getDueMaintenanceAssets(user: AuthUser): Promise<{
    overdueSchedules: AssetMaintenanceSchedule[];
    expiringWarranty: Asset[];
    expiringAmc: Asset[];
  }> {
    const societyId = this.getSocietyId(user);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    const [overdueSchedules, expiringWarranty, expiringAmc] = await Promise.all([
      this.schedulesRepo.find({
        where: {
          societyId,
          isActive: true,
          nextDueDate: LessThanOrEqual(today),
        },
        relations: ['asset'],
        order: { nextDueDate: 'ASC' },
      }),
      this.assetsRepo.find({
        where: {
          societyId,
          status: AssetStatus.ACTIVE,
          warrantyExpiryDate: LessThanOrEqual(thirtyDaysLater),
        },
        order: { warrantyExpiryDate: 'ASC' },
      }),
      this.assetsRepo.find({
        where: {
          societyId,
          status: AssetStatus.ACTIVE,
          amcExpiryDate: LessThanOrEqual(thirtyDaysLater),
        },
        order: { amcExpiryDate: 'ASC' },
      }),
    ]);

    return { overdueSchedules, expiringWarranty, expiringAmc };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔧 MAINTENANCE LOGS
  // ═══════════════════════════════════════════════════════════════════════════

  async addMaintenanceLog(
    user: AuthUser,
    assetId: string,
    dto: CreateMaintenanceLogDto,
  ): Promise<AssetMaintenanceLog> {
    const asset = await this.findAssetById(user, assetId);

    const log = this.maintenanceLogsRepo.create({
      societyId: asset.societyId,
      assetId: asset.id,
      maintenanceType: dto.maintenanceType,
      performedBy: dto.performedBy ?? null,
      vendorId: dto.vendorId ?? null,
      scheduledDate: new Date(dto.scheduledDate),
      completedDate: dto.completedDate ? new Date(dto.completedDate) : null,
      status: dto.status ?? MaintenanceLogStatus.SCHEDULED,
      cost: dto.cost != null ? this.round2(dto.cost) : null,
      description: dto.description ?? null,
      findings: dto.findings ?? null,
      nextMaintenanceDate: dto.nextMaintenanceDate ? new Date(dto.nextMaintenanceDate) : null,
      documentUrls: dto.documentUrls ?? null,
    });

    // If completed, update asset status back to ACTIVE
    if (log.status === MaintenanceLogStatus.COMPLETED) {
      if (asset.status === AssetStatus.UNDER_MAINTENANCE) {
        asset.status = AssetStatus.ACTIVE;
        await this.assetsRepo.save(asset);
      }
    } else if (log.status === MaintenanceLogStatus.IN_PROGRESS) {
      if (asset.status === AssetStatus.ACTIVE) {
        asset.status = AssetStatus.UNDER_MAINTENANCE;
        await this.assetsRepo.save(asset);
      }
    }

    return this.maintenanceLogsRepo.save(log);
  }

  async getMaintenanceLogs(user: AuthUser, assetId: string): Promise<AssetMaintenanceLog[]> {
    // Verify asset belongs to this society
    await this.findAssetById(user, assetId);

    const societyId = this.getSocietyId(user);
    return this.maintenanceLogsRepo.find({
      where: { societyId, assetId },
      order: { scheduledDate: 'DESC' },
    });
  }

  async updateMaintenanceLog(
    user: AuthUser,
    assetId: string,
    logId: string,
    dto: UpdateMaintenanceLogDto,
  ): Promise<AssetMaintenanceLog> {
    const asset = await this.findAssetById(user, assetId);
    const societyId = this.getSocietyId(user);

    const log = await this.maintenanceLogsRepo.findOne({
      where: { id: logId, assetId, societyId },
    });
    if (!log) {
      throw new NotFoundException(`Maintenance log ${logId} not found`);
    }

    if (log.status === MaintenanceLogStatus.COMPLETED) {
      throw new BadRequestException('Cannot update a completed maintenance log');
    }

    Object.assign(log, {
      ...(dto.maintenanceType !== undefined && { maintenanceType: dto.maintenanceType }),
      ...(dto.performedBy !== undefined && { performedBy: dto.performedBy }),
      ...(dto.vendorId !== undefined && { vendorId: dto.vendorId }),
      ...(dto.scheduledDate !== undefined && { scheduledDate: new Date(dto.scheduledDate) }),
      ...(dto.completedDate !== undefined && {
        completedDate: dto.completedDate ? new Date(dto.completedDate) : null,
      }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.cost !== undefined && { cost: dto.cost != null ? this.round2(dto.cost) : null }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.findings !== undefined && { findings: dto.findings }),
      ...(dto.nextMaintenanceDate !== undefined && {
        nextMaintenanceDate: dto.nextMaintenanceDate ? new Date(dto.nextMaintenanceDate) : null,
      }),
      ...(dto.documentUrls !== undefined && { documentUrls: dto.documentUrls }),
    });

    // Status side-effects on asset
    if (dto.status === MaintenanceLogStatus.COMPLETED && asset.status === AssetStatus.UNDER_MAINTENANCE) {
      asset.status = AssetStatus.ACTIVE;
      await this.assetsRepo.save(asset);
    }

    return this.maintenanceLogsRepo.save(log);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📅 MAINTENANCE SCHEDULES
  // ═══════════════════════════════════════════════════════════════════════════

  async createSchedule(
    user: AuthUser,
    assetId: string,
    dto: CreateMaintenanceScheduleDto,
  ): Promise<AssetMaintenanceSchedule> {
    const asset = await this.findAssetById(user, assetId);

    const schedule = this.schedulesRepo.create({
      societyId: asset.societyId,
      assetId: asset.id,
      frequency: dto.frequency,
      nextDueDate: new Date(dto.nextDueDate),
      notes: dto.notes ?? null,
    });

    return this.schedulesRepo.save(schedule);
  }

  async updateSchedule(
    user: AuthUser,
    assetId: string,
    scheduleId: string,
    dto: UpdateMaintenanceScheduleDto,
  ): Promise<AssetMaintenanceSchedule> {
    await this.findAssetById(user, assetId);
    const societyId = this.getSocietyId(user);

    const schedule = await this.schedulesRepo.findOne({
      where: { id: scheduleId, assetId, societyId },
    });
    if (!schedule) {
      throw new NotFoundException(`Maintenance schedule ${scheduleId} not found`);
    }

    Object.assign(schedule, {
      ...(dto.frequency !== undefined && { frequency: dto.frequency }),
      ...(dto.nextDueDate !== undefined && { nextDueDate: new Date(dto.nextDueDate) }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
    });

    return this.schedulesRepo.save(schedule);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📉 DEPRECIATION
  // ═══════════════════════════════════════════════════════════════════════════

  async recordDepreciation(
    user: AuthUser,
    assetId: string,
    dto: RecordDepreciationDto,
  ): Promise<AssetDepreciationLog> {
    const asset = await this.findAssetById(user, assetId);

    if (asset.currentValue == null) {
      throw new BadRequestException(
        'Asset has no current book value. Set a purchase cost first.',
      );
    }

    const currentValue = Number(asset.currentValue);
    const depreciationAmount = this.round2(dto.depreciationAmount);

    if (depreciationAmount > currentValue) {
      throw new BadRequestException(
        `Depreciation amount (${depreciationAmount}) exceeds current book value (${currentValue})`,
      );
    }

    const bookValueAfter = this.round2(currentValue - depreciationAmount);

    const entry = this.depreciationLogsRepo.create({
      societyId: asset.societyId,
      assetId: asset.id,
      depreciationDate: new Date(dto.depreciationDate),
      depreciationAmount,
      bookValueAfter,
      method: dto.method,
      notes: dto.notes ?? null,
    });

    // Update asset's current value
    asset.currentValue = bookValueAfter;
    await this.assetsRepo.save(asset);

    return this.depreciationLogsRepo.save(entry);
  }

  async getDepreciationLogs(user: AuthUser, assetId: string): Promise<AssetDepreciationLog[]> {
    await this.findAssetById(user, assetId);
    const societyId = this.getSocietyId(user);

    return this.depreciationLogsRepo.find({
      where: { societyId, assetId },
      order: { depreciationDate: 'DESC' },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔔 SCHEDULER HELPERS (called by AssetsScheduler)
  // ═══════════════════════════════════════════════════════════════════════════

  async checkWarrantyExpiries(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const alertDays = [30, 15, 7];

    for (const days of alertDays) {
      const target = new Date(today);
      target.setDate(target.getDate() + days);
      const nextDay = new Date(target);
      nextDay.setDate(nextDay.getDate() + 1);

      const assets = await this.assetsRepo
        .createQueryBuilder('a')
        .where('a.warranty_expiry_date >= :target', { target })
        .andWhere('a.warranty_expiry_date < :nextDay', { nextDay })
        .andWhere('a.status != :disposed', { disposed: AssetStatus.DISPOSED })
        .andWhere(
          '(a.last_warranty_alert_sent_at IS NULL OR a.last_warranty_alert_sent_at < :cutoff)',
          { cutoff: today },
        )
        .getMany();

      for (const asset of assets) {
        try {
          await this.notificationsService.send({
            userId: 'broadcast-admin',
            societyId: asset.societyId,
            type: NotificationType.GENERAL,
            channel: NotificationChannel.IN_APP,
            subject: `⚠️ Asset Warranty Expiring in ${days} Days`,
            body: `Warranty for "${asset.name}" (${asset.category}) expires on ${asset.warrantyExpiryDate?.toISOString().split('T')[0]}. Please arrange renewal.`,
          });
          asset.lastWarrantyAlertSentAt = new Date();
          await this.assetsRepo.save(asset);
        } catch (err) {
          this.logger.error(`Failed to send warranty alert for asset ${asset.id}`, err);
        }
      }
    }
  }

  async checkAmcExpiries(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const alertDays = [30, 15, 7];

    for (const days of alertDays) {
      const target = new Date(today);
      target.setDate(target.getDate() + days);
      const nextDay = new Date(target);
      nextDay.setDate(nextDay.getDate() + 1);

      const assets = await this.assetsRepo
        .createQueryBuilder('a')
        .where('a.amc_expiry_date >= :target', { target })
        .andWhere('a.amc_expiry_date < :nextDay', { nextDay })
        .andWhere('a.status != :disposed', { disposed: AssetStatus.DISPOSED })
        .andWhere(
          '(a.last_amc_alert_sent_at IS NULL OR a.last_amc_alert_sent_at < :cutoff)',
          { cutoff: today },
        )
        .getMany();

      for (const asset of assets) {
        try {
          await this.notificationsService.send({
            userId: 'broadcast-admin',
            societyId: asset.societyId,
            type: NotificationType.GENERAL,
            channel: NotificationChannel.IN_APP,
            subject: `⚠️ Asset AMC Expiring in ${days} Days`,
            body: `AMC for "${asset.name}" expires on ${asset.amcExpiryDate?.toISOString().split('T')[0]}. Please renew the service contract.`,
          });
          asset.lastAmcAlertSentAt = new Date();
          await this.assetsRepo.save(asset);
        } catch (err) {
          this.logger.error(`Failed to send AMC alert for asset ${asset.id}`, err);
        }
      }
    }
  }

  async checkDueMaintenance(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueSchedules = await this.schedulesRepo.find({
      where: {
        isActive: true,
        nextDueDate: LessThanOrEqual(today),
      },
      relations: ['asset'],
    });

    for (const schedule of dueSchedules) {
      if (!schedule.asset || schedule.asset.status === AssetStatus.DISPOSED) {
        continue;
      }
      try {
        await this.notificationsService.send({
          userId: 'broadcast-admin',
          societyId: schedule.societyId,
          type: NotificationType.GENERAL,
          channel: NotificationChannel.IN_APP,
          subject: `🔧 Maintenance Due: ${schedule.asset.name}`,
          body: `Scheduled ${schedule.frequency} maintenance for "${schedule.asset.name}" was due on ${schedule.nextDueDate.toISOString().split('T')[0]}. Please log a maintenance entry.`,
        });
      } catch (err) {
        this.logger.error(`Failed to send maintenance due alert for schedule ${schedule.id}`, err);
      }
    }
  }
}
