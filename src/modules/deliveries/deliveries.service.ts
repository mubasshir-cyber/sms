import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, Between, MoreThanOrEqual } from 'typeorm';
import { Delivery } from './entities/delivery.entity';
import { Gate } from '../visitors/entities/gate.entity';
import { Unit } from '../structure/entities/unit.entity';
import { Resident } from '../residents/entities/resident.entity';
import {
  CreateDeliveryDto,
  PreApproveDeliveryDto,
  CollectDeliveryDto,
  VerifyDeliveryOtpDto,
  AllowDirectEntryDto,
  ReturnDeliveryDto,
  UpdateDeliveryDto,
  DeliveryQueryDto,
} from './dto/deliveries.dto';
import { DeliveryStatus, DeliveryType } from '../../common/enums/delivery.enum';
import { Role, RESIDENT_ROLES, ADMIN_ROLES } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationChannel } from '../../common/enums/notification.enum';

@Injectable()
export class DeliveriesService {
  private readonly logger = new Logger(DeliveriesService.name);

  constructor(
    @InjectRepository(Delivery)
    private readonly deliveriesRepo: Repository<Delivery>,
    @InjectRepository(Gate)
    private readonly gatesRepo: Repository<Gate>,
    @InjectRepository(Unit)
    private readonly unitsRepo: Repository<Unit>,
    @InjectRepository(Resident)
    private readonly residentsRepo: Repository<Resident>,
    private readonly notificationsService: NotificationsService,
  ) {}

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📦 CREATE & LOG DELIVERIES
  // ═══════════════════════════════════════════════════════════════════════════

  async createDelivery(user: AuthUser, dto: CreateDeliveryDto): Promise<Delivery> {
    const societyId = user.societyId as string;

    // Validate gate
    const gate = await this.gatesRepo.findOne({
      where: { id: dto.gateId, societyId },
    });
    if (!gate) {
      throw new NotFoundException(`Gate with ID '${dto.gateId}' not found in this society`);
    }

    // Validate unit
    const unit = await this.unitsRepo.findOne({
      where: { id: dto.unitId, societyId },
    });
    if (!unit) {
      throw new NotFoundException(`Unit with ID '${dto.unitId}' not found in this society`);
    }

    const leaveAtGate = dto.leaveAtGate ?? true;
    const pickupOtp = this.generateOtp();
    const status = leaveAtGate ? DeliveryStatus.PENDING_PICKUP : DeliveryStatus.DELIVERED_TO_UNIT;

    const delivery = this.deliveriesRepo.create({
      societyId,
      unitId: dto.unitId,
      recipientUserId: dto.recipientUserId ?? null,
      gateId: dto.gateId,
      loggedByGuardId: user.sub,
      deliveryType: dto.deliveryType,
      company: dto.company,
      deliveryPersonName: dto.deliveryPersonName ?? null,
      deliveryPersonPhone: dto.deliveryPersonPhone ?? null,
      vehicleNumber: dto.vehicleNumber ?? null,
      trackingNumber: dto.trackingNumber ?? null,
      itemDescription: dto.itemDescription ?? null,
      photoUrl: dto.photoUrl ?? null,
      status,
      pickupOtp,
      leaveAtGate,
      arrivedAt: new Date(),
      notes: dto.notes ?? null,
    });

    const saved = await this.deliveriesRepo.save(delivery);

    // Notify resident(s)
    await this.notifyUnitResidents(
      societyId,
      dto.unitId,
      dto.recipientUserId,
      leaveAtGate
        ? {
            type: NotificationType.DELIVERY_ARRIVED,
            subject: `📦 Package from ${dto.company} arrived at ${gate.name}`,
            body: `A ${dto.deliveryType} package from ${dto.company} has been received at ${gate.name}. Your pickup OTP is ${pickupOtp}.`,
            payload: {
              deliveryId: saved.id,
              gateName: gate.name,
              company: dto.company,
              deliveryType: dto.deliveryType,
              pickupOtp,
            },
          }
        : {
            type: NotificationType.DELIVERY_DIRECT_ENTRY,
            subject: `🛵 ${dto.company} delivery permitted direct entry`,
            body: `A delivery person from ${dto.company} has been permitted direct entry at ${gate.name} to your unit.`,
            payload: {
              deliveryId: saved.id,
              gateName: gate.name,
              company: dto.company,
            },
          },
    );

    return saved;
  }

  async preApproveDelivery(user: AuthUser, dto: PreApproveDeliveryDto): Promise<Delivery> {
    const societyId = user.societyId as string;
    const isResident = RESIDENT_ROLES.includes(user.role as Role);

    const unitId = isResident ? (user.unitId ?? dto.unitId) : dto.unitId;
    if (!unitId) {
      throw new BadRequestException('unitId is required');
    }

    const unit = await this.unitsRepo.findOne({
      where: { id: unitId, societyId },
    });
    if (!unit) {
      throw new NotFoundException(`Unit with ID '${unitId}' not found`);
    }

    const passcode = this.generateOtp();
    const leaveAtGate = dto.leaveAtGate ?? true;

    // Use default active gate if not specified
    const defaultGate = await this.gatesRepo.findOne({
      where: { societyId, isActive: true },
      order: { name: 'ASC' },
    });

    const delivery = this.deliveriesRepo.create({
      societyId,
      unitId,
      recipientUserId: user.sub,
      gateId: defaultGate ? defaultGate.id : '00000000-0000-0000-0000-000000000000',
      loggedByGuardId: user.sub,
      deliveryType: dto.deliveryType,
      company: dto.company,
      deliveryPersonPhone: dto.deliveryPersonPhone ?? null,
      vehicleNumber: dto.vehicleNumber ?? null,
      status: DeliveryStatus.PENDING_PICKUP,
      pickupOtp: passcode,
      passcode,
      leaveAtGate,
      arrivedAt: new Date(),
      notes: dto.notes ? `Pre-approved by resident: ${dto.notes}` : 'Pre-approved by resident',
    });

    return this.deliveriesRepo.save(delivery);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔍 LIST & QUERY DELIVERIES
  // ═══════════════════════════════════════════════════════════════════════════

  async findDeliveries(
    user: AuthUser,
    query: DeliveryQueryDto,
  ): Promise<{
    data: Delivery[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const societyId = user.societyId as string;
    const qb = this.deliveriesRepo.createQueryBuilder('d')
      .where('d.society_id = :societyId', { societyId });

    // Scope check: residents can only see their unit's deliveries
    if (RESIDENT_ROLES.includes(user.role as Role)) {
      if (!user.unitId) {
        throw new ForbiddenException('User is not associated with any unit');
      }
      qb.andWhere('d.unit_id = :unitId', { unitId: user.unitId });
    } else if (query.unitId) {
      qb.andWhere('d.unit_id = :unitId', { unitId: query.unitId });
    }

    if (query.gateId) {
      qb.andWhere('d.gate_id = :gateId', { gateId: query.gateId });
    }

    if (query.status) {
      qb.andWhere('d.status = :status', { status: query.status });
    }

    if (query.deliveryType) {
      qb.andWhere('d.delivery_type = :deliveryType', { deliveryType: query.deliveryType });
    }

    if (query.isPending) {
      qb.andWhere('d.status = :pendingStatus', { pendingStatus: DeliveryStatus.PENDING_PICKUP });
    }

    if (query.isUnattended) {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      qb.andWhere('d.status = :pendingStatus AND d.arrived_at <= :cutoff', {
        pendingStatus: DeliveryStatus.PENDING_PICKUP,
        cutoff,
      });
    }

    if (query.startDate && query.endDate) {
      qb.andWhere('d.arrived_at BETWEEN :startDate AND :endDate', {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      });
    }

    if (query.search) {
      qb.andWhere(
        '(d.company ILIKE :search OR d.delivery_person_name ILIKE :search OR d.tracking_number ILIKE :search OR d.delivery_person_phone ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    qb.orderBy('d.arrived_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    // Data Privacy: Mask phone numbers for non-admin and non-guard roles if not their own unit
    if (!ADMIN_ROLES.includes(user.role as Role) && user.role !== Role.SECURITY_GUARD) {
      data.forEach(d => {
        if (d.deliveryPersonPhone) {
          d.deliveryPersonPhone = `XXXX-XX${d.deliveryPersonPhone.slice(-4)}`;
        }
      });
    }

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findPendingDeliveries(user: AuthUser): Promise<Delivery[]> {
    return (await this.findDeliveries(user, { isPending: true, page: 1, limit: 100 })).data;
  }

  async findUnattendedDeliveries(user: AuthUser): Promise<Delivery[]> {
    return (await this.findDeliveries(user, { isUnattended: true, page: 1, limit: 100 })).data;
  }

  async findMyDeliveries(user: AuthUser): Promise<Delivery[]> {
    if (!user.unitId) {
      throw new BadRequestException('User is not associated with any unit');
    }
    return (await this.findDeliveries(user, { unitId: user.unitId, page: 1, limit: 50 })).data;
  }

  async findDeliveryById(user: AuthUser, id: string): Promise<Delivery> {
    const delivery = await this.deliveriesRepo.findOne({
      where: { id, societyId: user.societyId as string },
    });

    if (!delivery) {
      throw new NotFoundException(`Delivery with ID '${id}' not found`);
    }

    if (RESIDENT_ROLES.includes(user.role as Role) && delivery.unitId !== user.unitId) {
      throw new ForbiddenException('You do not have permission to view deliveries for another unit');
    }

    return delivery;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🤝 COLLECTION, OTP VERIFICATION & HANDOVER
  // ═══════════════════════════════════════════════════════════════════════════

  async verifyPickupOtp(
    user: AuthUser,
    id: string,
    dto: VerifyDeliveryOtpDto,
  ): Promise<{ valid: boolean; message: string; delivery?: Delivery }> {
    const delivery = await this.findDeliveryById(user, id);

    if (delivery.status !== DeliveryStatus.PENDING_PICKUP) {
      return {
        valid: false,
        message: `Delivery is currently in '${delivery.status}' status, not pending pickup`,
      };
    }

    if (delivery.pickupOtp !== dto.otp) {
      return { valid: false, message: 'Incorrect OTP' };
    }

    return { valid: true, message: 'OTP verified successfully', delivery };
  }

  async collectDelivery(
    user: AuthUser,
    id: string,
    dto: CollectDeliveryDto,
  ): Promise<Delivery> {
    const delivery = await this.findDeliveryById(user, id);

    if (delivery.status !== DeliveryStatus.PENDING_PICKUP) {
      throw new BadRequestException(
        `Cannot collect delivery in '${delivery.status}' status. Must be pending_pickup.`,
      );
    }

    // OTP verification if provided or if required
    if (dto.pickupOtp && dto.pickupOtp !== delivery.pickupOtp) {
      throw new BadRequestException('Invalid pickup OTP provided');
    }

    const now = new Date();
    delivery.status = DeliveryStatus.COLLECTED;
    delivery.collectedAt = now;
    delivery.collectedByGuardId = user.sub;
    delivery.collectedByUserId = dto.collectedByUserId ?? delivery.recipientUserId ?? user.sub;

    if (dto.handoverPhotoUrl) {
      delivery.handoverPhotoUrl = dto.handoverPhotoUrl;
    }
    if (dto.notes) {
      delivery.notes = delivery.notes ? `${delivery.notes} | ${dto.notes}` : dto.notes;
    }

    const updated = await this.deliveriesRepo.save(delivery);

    // Notify resident that package was collected
    await this.notifyUnitResidents(
      delivery.societyId,
      delivery.unitId,
      delivery.recipientUserId,
      {
        type: NotificationType.DELIVERY_COLLECTED,
        subject: `✅ Package from ${delivery.company} collected`,
        body: `Your parcel from ${delivery.company} has been collected from the gate security desk.`,
        payload: {
          deliveryId: delivery.id,
          company: delivery.company,
          collectedAt: now.toISOString(),
        },
      },
    );

    return updated;
  }

  async allowDirectEntry(
    user: AuthUser,
    id: string,
    dto: AllowDirectEntryDto,
  ): Promise<Delivery> {
    const delivery = await this.findDeliveryById(user, id);

    delivery.status = DeliveryStatus.DELIVERED_TO_UNIT;
    delivery.leaveAtGate = false;
    if (dto.notes) {
      delivery.notes = delivery.notes ? `${delivery.notes} | ${dto.notes}` : dto.notes;
    }

    const updated = await this.deliveriesRepo.save(delivery);

    await this.notifyUnitResidents(
      delivery.societyId,
      delivery.unitId,
      delivery.recipientUserId,
      {
        type: NotificationType.DELIVERY_DIRECT_ENTRY,
        subject: `🛵 ${delivery.company} delivery partner entering society`,
        body: `Security has permitted the ${delivery.company} delivery partner direct entry to your unit.`,
        payload: { deliveryId: delivery.id, company: delivery.company },
      },
    );

    return updated;
  }

  async returnDelivery(
    user: AuthUser,
    id: string,
    dto: ReturnDeliveryDto,
  ): Promise<Delivery> {
    const delivery = await this.findDeliveryById(user, id);

    delivery.status = DeliveryStatus.RETURNED;
    delivery.notes = delivery.notes
      ? `${delivery.notes} | Returned reason: ${dto.reason}`
      : `Returned reason: ${dto.reason}`;

    return this.deliveriesRepo.save(delivery);
  }

  async updateDelivery(
    user: AuthUser,
    id: string,
    dto: UpdateDeliveryDto,
  ): Promise<Delivery> {
    const delivery = await this.findDeliveryById(user, id);
    Object.assign(delivery, dto);
    return this.deliveriesRepo.save(delivery);
  }

  async deleteDelivery(user: AuthUser, id: string): Promise<{ success: boolean }> {
    const delivery = await this.findDeliveryById(user, id);
    await this.deliveriesRepo.softRemove(delivery);
    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📊 ANALYTICS & STATS
  // ═══════════════════════════════════════════════════════════════════════════

  async getAnalytics(user: AuthUser): Promise<{
    todayTotal: number;
    pendingPickup: number;
    todayCollected: number;
    todayDirectEntry: number;
    unattendedCount: number;
    byType: Record<string, number>;
  }> {
    const societyId = user.societyId as string;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const todayTotal = await this.deliveriesRepo.count({
      where: {
        societyId,
        arrivedAt: Between(startOfDay, endOfDay),
      },
    });

    const pendingPickup = await this.deliveriesRepo.count({
      where: {
        societyId,
        status: DeliveryStatus.PENDING_PICKUP,
      },
    });

    const todayCollected = await this.deliveriesRepo.count({
      where: {
        societyId,
        status: DeliveryStatus.COLLECTED,
        collectedAt: Between(startOfDay, endOfDay),
      },
    });

    const todayDirectEntry = await this.deliveriesRepo.count({
      where: {
        societyId,
        status: DeliveryStatus.DELIVERED_TO_UNIT,
        arrivedAt: Between(startOfDay, endOfDay),
      },
    });

    const unattendedCount = await this.deliveriesRepo.count({
      where: {
        societyId,
        status: DeliveryStatus.PENDING_PICKUP,
        arrivedAt: LessThanOrEqual(cutoff24h),
      },
    });

    // Breakdown by delivery type
    const rawByType = await this.deliveriesRepo
      .createQueryBuilder('d')
      .select('d.delivery_type', 'type')
      .addSelect('COUNT(d.id)', 'count')
      .where('d.society_id = :societyId', { societyId })
      .groupBy('d.delivery_type')
      .getRawMany();

    const byType: Record<string, number> = {};
    for (const item of rawByType) {
      byType[item.type] = parseInt(item.count, 10);
    }

    return {
      todayTotal,
      pendingPickup,
      todayCollected,
      todayDirectEntry,
      unattendedCount,
      byType,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ⏰ UNATTENDED PARCEL SCANNER (SCHEDULED TASK)
  // ═══════════════════════════════════════════════════════════════════════════

  async processUnattendedParcels(): Promise<{ processedCount: number }> {
    const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const unattendedParcels = await this.deliveriesRepo.find({
      where: {
        status: DeliveryStatus.PENDING_PICKUP,
        arrivedAt: LessThanOrEqual(cutoff24h),
        isUnattendedAlertSent: false,
      },
    });

    this.logger.log(`Found ${unattendedParcels.length} unattended parcel(s) awaiting alert.`);

    let count = 0;
    for (const parcel of unattendedParcels) {
      try {
        await this.notifyUnitResidents(
          parcel.societyId,
          parcel.unitId,
          parcel.recipientUserId,
          {
            type: NotificationType.DELIVERY_UNATTENDED_ALERT,
            subject: `⚠️ Reminder: Uncollected parcel waiting at gate (${parcel.company})`,
            body: `You have an uncollected parcel from ${parcel.company} waiting at the gate since ${parcel.arrivedAt.toLocaleDateString()}. Your pickup OTP is ${parcel.pickupOtp}.`,
            payload: {
              deliveryId: parcel.id,
              company: parcel.company,
              pickupOtp: parcel.pickupOtp,
            },
          },
        );

        parcel.isUnattendedAlertSent = true;
        parcel.unattendedAlertSentAt = new Date();
        await this.deliveriesRepo.save(parcel);
        count++;
      } catch (err) {
        this.logger.error(`Failed to dispatch unattended alert for delivery ${parcel.id}:`, err);
      }
    }

    return { processedCount: count };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔔 HELPER NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  private async notifyUnitResidents(
    societyId: string,
    unitId: string,
    specificUserId: string | null | undefined,
    notif: {
      type: NotificationType;
      subject: string;
      body: string;
      payload?: Record<string, unknown>;
    },
  ): Promise<void> {
    try {
      const userIds: string[] = [];

      if (specificUserId) {
        userIds.push(specificUserId);
      } else {
        const residents = await this.residentsRepo.find({
          where: { unitId, societyId, isActive: true },
        });
        userIds.push(...residents.map(r => r.userId));
      }

      if (userIds.length === 0) return;

      const notifDtos = userIds.map(userId => ({
        userId,
        societyId,
        type: notif.type,
        channel: NotificationChannel.IN_APP,
        subject: notif.subject,
        body: notif.body,
        payload: notif.payload,
      }));

      await this.notificationsService.sendBulk(notifDtos);
    } catch (err) {
      this.logger.warn(`Could not dispatch delivery notification for unit ${unitId}:`, err);
    }
  }
}
