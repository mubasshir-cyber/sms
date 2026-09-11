import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Facility } from './entities/facility.entity';
import { FacilityBooking } from './entities/facility-booking.entity';
import { FacilityBookingStatusHistory } from './entities/facility-booking-status-history.entity';
import { Resident } from '../residents/entities/resident.entity';
import {
  CreateFacilityDto,
  UpdateFacilityDto,
  FacilityQueryDto,
} from './dto/facility.dto';
import {
  CreateBookingDto,
  ActionBookingDto,
  CancelBookingDto,
  BookingQueryDto,
} from './dto/booking.dto';
import {
  CapacityType,
  BookingStatus,
  BookingSlotType,
} from '../../common/enums/facility-booking.enum';
import { Role, ADMIN_ROLES, RESIDENT_ROLES } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationChannel } from '../../common/enums/notification.enum';

@Injectable()
export class FacilitiesService {
  private readonly logger = new Logger(FacilitiesService.name);

  constructor(
    @InjectRepository(Facility)
    private readonly facilityRepo: Repository<Facility>,
    @InjectRepository(FacilityBooking)
    private readonly bookingRepo: Repository<FacilityBooking>,
    @InjectRepository(FacilityBookingStatusHistory)
    private readonly historyRepo: Repository<FacilityBookingStatusHistory>,
    @InjectRepository(Resident)
    private readonly residentRepo: Repository<Resident>,
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
  ) {}

  private getSocietyId(user: AuthUser): string {
    if (!user.societyId) {
      throw new ForbiddenException('User is not associated with any society');
    }
    return user.societyId;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏛️ FACILITY MANAGEMENT (CRUD)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create a new facility / amenity.
   */
  async createFacility(user: AuthUser, dto: CreateFacilityDto): Promise<Facility> {
    const societyId = this.getSocietyId(user);
    const name = dto.name.trim();

    const existing = await this.facilityRepo.findOne({
      where: { societyId, name },
    });

    if (existing) {
      throw new ConflictException(`Facility with name "${name}" already exists in this society`);
    }

    if (dto.openTime >= dto.closeTime) {
      throw new BadRequestException('openTime must be strictly earlier than closeTime');
    }

    const facility = this.facilityRepo.create({
      societyId,
      name,
      facilityType: dto.facilityType,
      capacityType: dto.capacityType ?? CapacityType.EXCLUSIVE,
      description: dto.description?.trim() ?? null,
      location: dto.location?.trim() ?? null,
      capacity: dto.capacity,
      rules: dto.rules?.trim() ?? null,
      imageUrls: dto.imageUrls ?? [],
      bookingSlotType: dto.bookingSlotType ?? BookingSlotType.HOURLY,
      slotDurationMinutes: dto.slotDurationMinutes ?? 60,
      openTime: dto.openTime,
      closeTime: dto.closeTime,
      bookingFee: dto.bookingFee ?? 0.0,
      depositFee: dto.depositFee ?? 0.0,
      requiresApproval: dto.requiresApproval ?? false,
      maxBookingsPerMonthPerUnit: dto.maxBookingsPerMonthPerUnit ?? 4,
      advanceBookingDaysLimit: dto.advanceBookingDaysLimit ?? 30,
      cancellationHoursBefore: dto.cancellationHoursBefore ?? 24,
      isActive: true,
    });

    const saved = await this.facilityRepo.save(facility);
    this.logger.log(`Facility "${saved.name}" (${saved.id}) created for society ${societyId}`);
    return saved;
  }

  /**
   * List facilities with filtering and pagination.
   */
  async findFacilities(
    user: AuthUser,
    query: FacilityQueryDto,
  ): Promise<{ data: Facility[]; total: number; page: number; limit: number }> {
    const societyId = this.getSocietyId(user);
    const qb = this.facilityRepo
      .createQueryBuilder('facility')
      .where('facility.societyId = :societyId', { societyId });

    if (query.facilityType) {
      qb.andWhere('facility.facilityType = :fType', { fType: query.facilityType });
    }

    if (query.capacityType) {
      qb.andWhere('facility.capacityType = :cType', { cType: query.capacityType });
    }

    if (query.requiresApproval !== undefined) {
      qb.andWhere('facility.requiresApproval = :reqApp', { reqApp: query.requiresApproval });
    }

    if (query.isActive !== undefined) {
      qb.andWhere('facility.isActive = :isActive', { isActive: query.isActive });
    }

    if (query.search) {
      const s = `%${query.search.trim()}%`;
      qb.andWhere('(facility.name ILIKE :s OR facility.location ILIKE :s)', { s });
    }

    qb.orderBy('facility.name', 'ASC');

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  /**
   * Get single facility by ID.
   */
  async findFacilityById(user: AuthUser, id: string): Promise<Facility> {
    const societyId = this.getSocietyId(user);
    const facility = await this.facilityRepo.findOne({
      where: { id, societyId },
    });

    if (!facility) {
      throw new NotFoundException(`Facility with ID ${id} not found`);
    }

    return facility;
  }

  /**
   * Update facility configuration.
   */
  async updateFacility(user: AuthUser, id: string, dto: UpdateFacilityDto): Promise<Facility> {
    const facility = await this.findFacilityById(user, id);

    if (dto.name) {
      const newName = dto.name.trim();
      if (newName !== facility.name) {
        const conflict = await this.facilityRepo.findOne({
          where: { societyId: facility.societyId, name: newName },
        });
        if (conflict) {
          throw new ConflictException(`Facility with name "${newName}" already exists`);
        }
        facility.name = newName;
      }
    }

    const open = dto.openTime ?? facility.openTime;
    const close = dto.closeTime ?? facility.closeTime;
    if (open >= close) {
      throw new BadRequestException('openTime must be strictly earlier than closeTime');
    }

    if (dto.facilityType !== undefined) facility.facilityType = dto.facilityType;
    if (dto.capacityType !== undefined) facility.capacityType = dto.capacityType;
    if (dto.description !== undefined) facility.description = dto.description?.trim() ?? null;
    if (dto.location !== undefined) facility.location = dto.location?.trim() ?? null;
    if (dto.capacity !== undefined) facility.capacity = dto.capacity;
    if (dto.rules !== undefined) facility.rules = dto.rules?.trim() ?? null;
    if (dto.imageUrls !== undefined) facility.imageUrls = dto.imageUrls;
    if (dto.bookingSlotType !== undefined) facility.bookingSlotType = dto.bookingSlotType;
    if (dto.slotDurationMinutes !== undefined) facility.slotDurationMinutes = dto.slotDurationMinutes;
    if (dto.openTime !== undefined) facility.openTime = dto.openTime;
    if (dto.closeTime !== undefined) facility.closeTime = dto.closeTime;
    if (dto.bookingFee !== undefined) facility.bookingFee = dto.bookingFee;
    if (dto.depositFee !== undefined) facility.depositFee = dto.depositFee;
    if (dto.requiresApproval !== undefined) facility.requiresApproval = dto.requiresApproval;
    if (dto.maxBookingsPerMonthPerUnit !== undefined) facility.maxBookingsPerMonthPerUnit = dto.maxBookingsPerMonthPerUnit;
    if (dto.advanceBookingDaysLimit !== undefined) facility.advanceBookingDaysLimit = dto.advanceBookingDaysLimit;
    if (dto.cancellationHoursBefore !== undefined) facility.cancellationHoursBefore = dto.cancellationHoursBefore;
    if (dto.isActive !== undefined) facility.isActive = dto.isActive;

    return this.facilityRepo.save(facility);
  }

  /**
   * Soft-delete a facility (prevents deleting if upcoming confirmed bookings exist).
   */
  async deleteFacility(user: AuthUser, id: string): Promise<{ success: boolean }> {
    const facility = await this.findFacilityById(user, id);

    const today = new Date().toISOString().slice(0, 10);
    const activeUpcoming = await this.bookingRepo.count({
      where: {
        facilityId: id,
        societyId: facility.societyId,
        status: In([BookingStatus.CONFIRMED, BookingStatus.PENDING_APPROVAL]),
        bookingDate: today,
      },
    });

    if (activeUpcoming > 0) {
      throw new BadRequestException(
        'Cannot delete facility with active or upcoming bookings. Please cancel bookings first.',
      );
    }

    facility.isActive = false;
    await this.facilityRepo.save(facility);
    await this.facilityRepo.softDelete(id);
    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📅 AVAILABILITY ENGINE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Check real-time slot availability for a facility on a specific date.
   */
  async checkAvailability(
    user: AuthUser,
    facilityId: string,
    date: string,
  ): Promise<{
    facility: {
      id: string;
      name: string;
      capacityType: CapacityType;
      capacity: number;
      bookingFee: number;
      depositFee: number;
      slotDurationMinutes: number;
    };
    date: string;
    slots: Array<{
      startTime: string;
      endTime: string;
      isAvailable: boolean;
      bookedAttendees: number;
      remainingCapacity: number;
    }>;
  }> {
    const facility = await this.findFacilityById(user, facilityId);

    const activeBookings = await this.bookingRepo.find({
      where: {
        facilityId: facility.id,
        societyId: facility.societyId,
        bookingDate: date,
        status: In([BookingStatus.CONFIRMED, BookingStatus.PENDING_APPROVAL]),
      },
    });

    const [openH, openM] = facility.openTime.split(':').map(Number);
    const [closeH, closeM] = facility.closeTime.split(':').map(Number);
    const duration = facility.slotDurationMinutes;

    let currentMinutes = openH * 60 + openM;
    const endMinutes = closeH * 60 + closeM;

    const slots: Array<{
      startTime: string;
      endTime: string;
      isAvailable: boolean;
      bookedAttendees: number;
      remainingCapacity: number;
    }> = [];

    const pad = (n: number) => String(n).padStart(2, '0');

    while (currentMinutes + duration <= endMinutes) {
      const slotStartH = Math.floor(currentMinutes / 60);
      const slotStartM = currentMinutes % 60;
      const slotEndTotal = currentMinutes + duration;
      const slotEndH = Math.floor(slotEndTotal / 60);
      const slotEndM = slotEndTotal % 60;

      const slotStartStr = `${pad(slotStartH)}:${pad(slotStartM)}`;
      const slotEndStr = `${pad(slotEndH)}:${pad(slotEndM)}`;

      // Calculate overlap with existing active bookings
      let bookedAttendees = 0;
      let hasOverlap = false;

      for (const b of activeBookings) {
        // Overlap condition: b.startTime < slotEndStr && slotStartStr < b.endTime
        if (b.startTime < slotEndStr && slotStartStr < b.endTime) {
          hasOverlap = true;
          bookedAttendees += b.attendeesCount;
        }
      }

      let isAvailable = false;
      let remainingCapacity = 0;

      if (facility.capacityType === CapacityType.EXCLUSIVE) {
        isAvailable = !hasOverlap;
        remainingCapacity = isAvailable ? facility.capacity : 0;
      } else {
        remainingCapacity = Math.max(0, facility.capacity - bookedAttendees);
        isAvailable = remainingCapacity > 0;
      }

      slots.push({
        startTime: slotStartStr,
        endTime: slotEndStr,
        isAvailable,
        bookedAttendees,
        remainingCapacity,
      });

      currentMinutes += duration;
    }

    return {
      facility: {
        id: facility.id,
        name: facility.name,
        capacityType: facility.capacityType,
        capacity: facility.capacity,
        bookingFee: Number(facility.bookingFee),
        depositFee: Number(facility.depositFee),
        slotDurationMinutes: facility.slotDurationMinutes,
      },
      date,
      slots,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📝 TRANSACTIONAL BOOKING CREATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create a booking inside a transaction with pessimistic locking to prevent concurrency collisions.
   */
  async createBooking(user: AuthUser, dto: CreateBookingDto): Promise<FacilityBooking> {
    const societyId = this.getSocietyId(user);
    let targetUnitId = dto.unitId;

    // 1. Resolve & validate resident unit
    if (RESIDENT_ROLES.includes(user.role)) {
      const resident = await this.residentRepo.findOne({
        where: { userId: user.sub, societyId, isActive: true },
      });

      if (!resident) {
        throw new ForbiddenException('You are not registered as an active resident in this society');
      }

      if (targetUnitId && targetUnitId !== resident.unitId) {
        throw new ForbiddenException('You can only book amenities for your own registered unit');
      }
      targetUnitId = resident.unitId;
    } else if (!targetUnitId) {
      throw new BadRequestException('unitId is required when creating a booking as administrator');
    }

    // 2. Validate bookingDate is not in the past
    const todayStr = new Date().toISOString().slice(0, 10);
    if (dto.bookingDate < todayStr) {
      throw new BadRequestException('Cannot make bookings for past dates');
    }

    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException('startTime must be strictly earlier than endTime');
    }

    // Execute within isolated database transaction with pessimistic locking
    return this.dataSource.transaction(async (manager) => {
      // Lock the facility row to serialize concurrent booking operations for this facility
      const facility = await manager.findOne(Facility, {
        where: { id: dto.facilityId, societyId, isActive: true },
        lock: { mode: 'pessimistic_write' },
      });

      if (!facility) {
        throw new NotFoundException(`Facility with ID ${dto.facilityId} not found or inactive`);
      }

      // 3. Operating hours validation
      if (dto.startTime < facility.openTime || dto.endTime > facility.closeTime) {
        throw new BadRequestException(
          `Booking hours (${dto.startTime} - ${dto.endTime}) are outside facility operating hours (${facility.openTime} - ${facility.closeTime})`,
        );
      }

      // 4. Advance booking days limit validation
      const bookingDateObj = new Date(dto.bookingDate);
      const todayObj = new Date(todayStr);
      const diffDays = Math.ceil(
        (bookingDateObj.getTime() - todayObj.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays > facility.advanceBookingDaysLimit) {
        throw new BadRequestException(
          `Cannot book more than ${facility.advanceBookingDaysLimit} days in advance`,
        );
      }

      // 5. Monthly unit quota validation (only CONFIRMED and PENDING_APPROVAL count; cancelled/rejected excluded)
      const bookingYear = bookingDateObj.getFullYear();
      const bookingMonth = bookingDateObj.getMonth() + 1;
      const startOfMonth = `${bookingYear}-${String(bookingMonth).padStart(2, '0')}-01`;
      const endOfMonth = `${bookingYear}-${String(bookingMonth).padStart(2, '0')}-31`;

      const currentMonthlyCount = await manager
        .createQueryBuilder(FacilityBooking, 'fb')
        .where('fb.facilityId = :facilityId', { facilityId: facility.id })
        .andWhere('fb.unitId = :unitId', { unitId: targetUnitId })
        .andWhere('fb.bookingDate >= :startOfMonth', { startOfMonth })
        .andWhere('fb.bookingDate <= :endOfMonth', { endOfMonth })
        .andWhere('fb.status IN (:...activeStatuses)', {
          activeStatuses: [BookingStatus.CONFIRMED, BookingStatus.PENDING_APPROVAL],
        })
        .getCount();

      if (currentMonthlyCount >= facility.maxBookingsPerMonthPerUnit) {
        throw new BadRequestException(
          `Unit has reached the maximum allowed limit of ${facility.maxBookingsPerMonthPerUnit} booking(s) for this facility this month`,
        );
      }

      // 6. Capacity & overlap verification
      const existingOverlapping = await manager
        .createQueryBuilder(FacilityBooking, 'b')
        .where('b.facilityId = :facilityId', { facilityId: facility.id })
        .andWhere('b.bookingDate = :date', { date: dto.bookingDate })
        .andWhere('b.status IN (:...activeStatuses)', {
          activeStatuses: [BookingStatus.CONFIRMED, BookingStatus.PENDING_APPROVAL],
        })
        .andWhere('b.startTime < :endTime', { endTime: dto.endTime })
        .andWhere('b.endTime > :startTime', { startTime: dto.startTime })
        .getMany();

      if (facility.capacityType === CapacityType.EXCLUSIVE) {
        if (existingOverlapping.length > 0) {
          throw new ConflictException(
            'The requested time slot conflicts with an existing booking for this exclusive facility',
          );
        }
      } else {
        // SHARED amenity: check attendees threshold
        const totalBookedAttendees = existingOverlapping.reduce(
          (sum, cur) => sum + cur.attendeesCount,
          0,
        );
        if (totalBookedAttendees + dto.attendeesCount > facility.capacity) {
          const remaining = Math.max(0, facility.capacity - totalBookedAttendees);
          throw new ConflictException(
            `Booking exceeds remaining facility capacity for this time slot. Available slots: ${remaining}`,
          );
        }
      }

      // 7. Determine initial status
      const initialStatus = facility.requiresApproval
        ? BookingStatus.PENDING_APPROVAL
        : BookingStatus.CONFIRMED;

      const booking = manager.create(FacilityBooking, {
        societyId,
        facilityId: facility.id,
        unitId: targetUnitId,
        userId: user.sub,
        bookingDate: dto.bookingDate,
        startTime: dto.startTime,
        endTime: dto.endTime,
        attendeesCount: dto.attendeesCount,
        status: initialStatus,
        totalFee: Number(facility.bookingFee),
        depositFee: Number(facility.depositFee),
        purpose: dto.purpose?.trim() ?? null,
      });

      const savedBooking = await manager.save(FacilityBooking, booking);

      // 8. Log initial status history
      const history = manager.create(FacilityBookingStatusHistory, {
        societyId,
        bookingId: savedBooking.id,
        oldStatus: null,
        newStatus: initialStatus,
        changedByUserId: user.sub,
        reason: 'Initial booking creation',
      });
      await manager.save(FacilityBookingStatusHistory, history);

      this.logger.log(
        `Booking ${savedBooking.id} created for ${facility.name} (Status: ${initialStatus})`,
      );

      // 9. Dispatch notification
      try {
        await this.notificationsService.send({
          userId: user.sub,
          societyId,
          type: NotificationType.GENERAL,
          channel: NotificationChannel.IN_APP,
          subject:
            initialStatus === BookingStatus.CONFIRMED
              ? `✅ Amenity Booking Confirmed: ${facility.name}`
              : `⏳ Amenity Booking Submitted: ${facility.name}`,
          body:
            initialStatus === BookingStatus.CONFIRMED
              ? `Your booking for ${facility.name} on ${dto.bookingDate} (${dto.startTime} - ${dto.endTime}) is confirmed.`
              : `Your booking request for ${facility.name} on ${dto.bookingDate} (${dto.startTime} - ${dto.endTime}) is pending approval by the committee.`,
          payload: { bookingId: savedBooking.id, facilityId: facility.id, status: initialStatus },
        });
      } catch (err) {
        this.logger.warn(`Failed to dispatch booking notification: ${err}`);
      }

      return savedBooking;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📋 BOOKING LIST & QUERY
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Find bookings with role-based scoping and filters.
   */
  async findBookings(
    user: AuthUser,
    query: BookingQueryDto,
  ): Promise<{ data: FacilityBooking[]; total: number; page: number; limit: number }> {
    const societyId = this.getSocietyId(user);
    const qb = this.bookingRepo
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.facility', 'facility')
      .leftJoinAndSelect('booking.unit', 'unit')
      .leftJoinAndSelect('booking.user', 'user')
      .where('booking.societyId = :societyId', { societyId });

    if (RESIDENT_ROLES.includes(user.role)) {
      qb.andWhere('booking.userId = :userId', { userId: user.sub });
    } else if (query.unitId) {
      qb.andWhere('booking.unitId = :unitId', { unitId: query.unitId });
    }

    if (query.facilityId) {
      qb.andWhere('booking.facilityId = :facilityId', { facilityId: query.facilityId });
    }

    if (query.status) {
      qb.andWhere('booking.status = :status', { status: query.status });
    }

    if (query.fromDate) {
      qb.andWhere('booking.bookingDate >= :fromDate', { fromDate: query.fromDate });
    }

    if (query.toDate) {
      qb.andWhere('booking.bookingDate <= :toDate', { toDate: query.toDate });
    }

    qb.orderBy('booking.bookingDate', 'DESC').addOrderBy('booking.startTime', 'DESC');

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  /**
   * Get booking by ID.
   */
  async findBookingById(user: AuthUser, id: string): Promise<FacilityBooking> {
    const societyId = this.getSocietyId(user);
    const booking = await this.bookingRepo.findOne({
      where: { id, societyId },
      relations: ['facility', 'unit', 'user'],
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    if (RESIDENT_ROLES.includes(user.role) && booking.userId !== user.sub) {
      throw new ForbiddenException('You do not have permission to view this booking');
    }

    return booking;
  }

  /**
   * Get audit history for a booking.
   */
  async getBookingHistory(user: AuthUser, id: string): Promise<FacilityBookingStatusHistory[]> {
    // Validate access to booking first
    await this.findBookingById(user, id);

    return this.historyRepo.find({
      where: { bookingId: id, societyId: this.getSocietyId(user) },
      relations: ['changedByUser'],
      order: { createdAt: 'ASC' },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ✍️ APPROVAL & REJECTION LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Approve or reject a booking (Admin, FacilityManager, Committee).
   */
  async actionBooking(
    user: AuthUser,
    bookingId: string,
    dto: ActionBookingDto,
  ): Promise<FacilityBooking> {
    const societyId = this.getSocietyId(user);

    if (dto.status === BookingStatus.REJECTED && !dto.rejectionReason?.trim()) {
      throw new BadRequestException('rejectionReason is mandatory when rejecting a booking');
    }

    return this.dataSource.transaction(async (manager) => {
      const booking = await manager.findOne(FacilityBooking, {
        where: { id: bookingId, societyId },
        relations: ['facility'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!booking) {
        throw new NotFoundException(`Booking with ID ${bookingId} not found`);
      }

      if (booking.status !== BookingStatus.PENDING_APPROVAL) {
        throw new BadRequestException(`Cannot action booking with status "${booking.status}"`);
      }

      const oldStatus = booking.status;
      booking.status = dto.status;
      booking.approvedByUserId = user.sub;
      booking.approvedAt = new Date();
      booking.rejectionReason =
        dto.status === BookingStatus.REJECTED ? dto.rejectionReason!.trim() : null;

      const saved = await manager.save(FacilityBooking, booking);

      // Record status audit history
      const history = manager.create(FacilityBookingStatusHistory, {
        societyId,
        bookingId: booking.id,
        oldStatus,
        newStatus: dto.status,
        changedByUserId: user.sub,
        reason: dto.rejectionReason ?? (dto.status === BookingStatus.CONFIRMED ? 'Approved by admin' : null),
      });
      await manager.save(FacilityBookingStatusHistory, history);

      // Notify resident
      try {
        const isApproved = dto.status === BookingStatus.CONFIRMED;
        await this.notificationsService.send({
          userId: booking.userId,
          societyId,
          type: NotificationType.GENERAL,
          channel: NotificationChannel.IN_APP,
          subject: isApproved
            ? `🎉 Booking Approved: ${booking.facility?.name ?? 'Amenity'}`
            : `❌ Booking Request Rejected: ${booking.facility?.name ?? 'Amenity'}`,
          body: isApproved
            ? `Your booking for ${booking.facility?.name ?? 'the amenity'} on ${booking.bookingDate} (${booking.startTime} - ${booking.endTime}) has been approved.`
            : `Your booking for ${booking.facility?.name ?? 'the amenity'} was rejected. Reason: ${booking.rejectionReason}`,
          payload: { bookingId: booking.id, status: booking.status },
        });
      } catch (err) {
        this.logger.warn(`Failed to dispatch action notification: ${err}`);
      }

      return saved;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🚫 CANCELLATION LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Cancel a booking (Resident or Admin).
   */
  async cancelBooking(
    user: AuthUser,
    bookingId: string,
    dto: CancelBookingDto,
  ): Promise<FacilityBooking> {
    const societyId = this.getSocietyId(user);

    return this.dataSource.transaction(async (manager) => {
      const booking = await manager.findOne(FacilityBooking, {
        where: { id: bookingId, societyId },
        relations: ['facility'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!booking) {
        throw new NotFoundException(`Booking with ID ${bookingId} not found`);
      }

      if (RESIDENT_ROLES.includes(user.role) && booking.userId !== user.sub) {
        throw new ForbiddenException('You can only cancel your own bookings');
      }

      if (booking.status === BookingStatus.CANCELLED) {
        throw new BadRequestException('Booking is already cancelled');
      }

      if (booking.status === BookingStatus.REJECTED || booking.status === BookingStatus.COMPLETED) {
        throw new BadRequestException(`Cannot cancel a booking that is ${booking.status}`);
      }

      // Check cancellation cut-off window if cancelled by resident
      if (RESIDENT_ROLES.includes(user.role) && booking.facility) {
        const bookingStart = new Date(`${booking.bookingDate}T${booking.startTime}:00`);
        const now = new Date();
        const hoursDiff = (bookingStart.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursDiff < booking.facility.cancellationHoursBefore) {
          throw new BadRequestException(
            `Cancellation allowed up to ${booking.facility.cancellationHoursBefore} hours before start time. Cut-off deadline has passed.`,
          );
        }
      }

      const oldStatus = booking.status;
      booking.status = BookingStatus.CANCELLED;
      booking.cancellationReason = dto.reason?.trim() ?? 'Cancelled by user';
      booking.cancelledAt = new Date();

      const saved = await manager.save(FacilityBooking, booking);

      // Record audit history
      const history = manager.create(FacilityBookingStatusHistory, {
        societyId,
        bookingId: booking.id,
        oldStatus,
        newStatus: BookingStatus.CANCELLED,
        changedByUserId: user.sub,
        reason: booking.cancellationReason,
      });
      await manager.save(FacilityBookingStatusHistory, history);

      this.logger.log(`Booking ${booking.id} cancelled`);
      return saved;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📊 ANALYTICS & USAGE METRICS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Analytics distinguishing confirmed revenue from cancellations/rejections.
   */
  async getBookingAnalytics(user: AuthUser): Promise<{
    summary: {
      totalBookings: number;
      confirmedBookings: number;
      pendingBookings: number;
      cancelledBookings: number;
      rejectedBookings: number;
      totalRevenue: number;
      totalDeposits: number;
    };
    byFacility: Array<{
      facilityId: string;
      facilityName: string;
      confirmedBookings: number;
      revenue: number;
    }>;
  }> {
    const societyId = this.getSocietyId(user);

    const bookings = await this.bookingRepo.find({
      where: { societyId },
      relations: ['facility'],
    });

    let totalConfirmed = 0;
    let totalPending = 0;
    let totalCancelled = 0;
    let totalRejected = 0;
    let totalRevenue = 0;
    let totalDeposits = 0;

    const facilityMap = new Map<string, { name: string; confirmed: number; revenue: number }>();

    for (const b of bookings) {
      if (b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.COMPLETED) {
        totalConfirmed++;
        totalRevenue += Number(b.totalFee);
        totalDeposits += Number(b.depositFee);

        const cur = facilityMap.get(b.facilityId) ?? {
          name: b.facility?.name ?? 'Unknown',
          confirmed: 0,
          revenue: 0,
        };
        cur.confirmed++;
        cur.revenue += Number(b.totalFee);
        facilityMap.set(b.facilityId, cur);
      } else if (b.status === BookingStatus.PENDING_APPROVAL) {
        totalPending++;
      } else if (b.status === BookingStatus.CANCELLED) {
        totalCancelled++;
      } else if (b.status === BookingStatus.REJECTED) {
        totalRejected++;
      }
    }

    const byFacility = Array.from(facilityMap.entries()).map(([facilityId, data]) => ({
      facilityId,
      facilityName: data.name,
      confirmedBookings: data.confirmed,
      revenue: Number(data.revenue.toFixed(2)),
    }));

    return {
      summary: {
        totalBookings: bookings.length,
        confirmedBookings: totalConfirmed,
        pendingBookings: totalPending,
        cancelledBookings: totalCancelled,
        rejectedBookings: totalRejected,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalDeposits: Number(totalDeposits.toFixed(2)),
      },
      byFacility,
    };
  }
}
