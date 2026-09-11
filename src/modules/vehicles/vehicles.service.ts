import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { ParkingSlot } from './entities/parking-slot.entity';
import { ParkingAllocation } from './entities/parking-allocation.entity';
import { ParkingTransfer } from './entities/parking-transfer.entity';
import { Resident } from '../residents/entities/resident.entity';
import {
  RegisterVehicleDto,
  UpdateVehicleDto,
  VerifyVehicleDto,
  VehicleQueryDto,
} from './dto/vehicle.dto';
import {
  CreateParkingSlotDto,
  BulkCreateSlotsDto,
  UpdateParkingSlotDto,
  AllocateSlotDto,
  CreateTransferRequestDto,
  ActionTransferDto,
  AssignVisitorParkingDto,
  ParkingSlotQueryDto,
} from './dto/parking.dto';
import {
  VehicleVerificationStatus,
  ParkingSlotStatus,
  AllocationType,
  TransferStatus,
} from '../../common/enums/vehicle-parking.enum';
import { Role, ADMIN_ROLES, RESIDENT_ROLES } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationChannel } from '../../common/enums/notification.enum';

@Injectable()
export class VehiclesService {
  private readonly logger = new Logger(VehiclesService.name);

  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,
    @InjectRepository(ParkingSlot)
    private readonly slotRepo: Repository<ParkingSlot>,
    @InjectRepository(ParkingAllocation)
    private readonly allocationRepo: Repository<ParkingAllocation>,
    @InjectRepository(ParkingTransfer)
    private readonly transferRepo: Repository<ParkingTransfer>,
    @InjectRepository(Resident)
    private readonly residentRepo: Repository<Resident>,
    private readonly notificationsService: NotificationsService,
  ) {}

  private getSocietyId(user: AuthUser): string {
    if (!user.societyId) {
      throw new ForbiddenException('User is not associated with any society');
    }
    return user.societyId;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🚗 VEHICLE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Register a new vehicle.
   * Residents register for their unit; Admins can register on behalf of any unit.
   */
  async registerVehicle(user: AuthUser, dto: RegisterVehicleDto): Promise<Vehicle> {
    const societyId = this.getSocietyId(user);
    let targetUnitId = dto.unitId;

    if (RESIDENT_ROLES.includes(user.role)) {
      const residentRecord = await this.residentRepo.findOne({
        where: { userId: user.sub, societyId, isActive: true },
      });

      if (!residentRecord) {
        throw new ForbiddenException('You are not registered as an active resident in this society');
      }

      if (targetUnitId && targetUnitId !== residentRecord.unitId) {
        throw new ForbiddenException('You can only register vehicles for your own unit');
      }
      targetUnitId = residentRecord.unitId;
    } else if (!targetUnitId) {
      throw new BadRequestException('unitId is required when registering a vehicle as administrator');
    }

    const regNumber = dto.registrationNumber.replace(/\s+/g, '').toUpperCase();

    // Check for existing active vehicle with same registration plate in society
    const existing = await this.vehicleRepo.findOne({
      where: {
        societyId,
        registrationNumber: regNumber,
        isActive: true,
      },
    });

    if (existing) {
      throw new ConflictException(
        `A vehicle with registration plate ${regNumber} is already registered in this society`,
      );
    }

    const vehicle = this.vehicleRepo.create({
      societyId,
      unitId: targetUnitId,
      userId: user.sub,
      vehicleType: dto.vehicleType,
      registrationNumber: regNumber,
      makeModel: dto.makeModel ?? null,
      color: dto.color ?? null,
      rfidTag: dto.rfidTag ? dto.rfidTag.trim().toUpperCase() : null,
      fastagNumber: dto.fastagNumber ? dto.fastagNumber.trim().toUpperCase() : null,
      rcDocumentUrl: dto.rcDocumentUrl ?? null,
      insuranceDocumentUrl: dto.insuranceDocumentUrl ?? null,
      insuranceExpiryDate: dto.insuranceExpiryDate ? new Date(dto.insuranceExpiryDate) : null,
      verificationStatus: ADMIN_ROLES.includes(user.role)
        ? VehicleVerificationStatus.VERIFIED
        : VehicleVerificationStatus.PENDING,
      verifiedByUserId: ADMIN_ROLES.includes(user.role) ? user.sub : null,
      verifiedAt: ADMIN_ROLES.includes(user.role) ? new Date() : null,
      isActive: true,
    });

    const saved = await this.vehicleRepo.save(vehicle);
    this.logger.log(`Vehicle ${saved.registrationNumber} registered for unit ${saved.unitId}`);
    return saved;
  }

  /**
   * List vehicles with role-based scoping and filters.
   */
  async findVehicles(
    user: AuthUser,
    query: VehicleQueryDto,
  ): Promise<{ data: Vehicle[]; total: number; page: number; limit: number }> {
    const societyId = this.getSocietyId(user);
    const qb = this.vehicleRepo
      .createQueryBuilder('vehicle')
      .leftJoinAndSelect('vehicle.unit', 'unit')
      .leftJoinAndSelect('vehicle.user', 'user')
      .leftJoinAndSelect('vehicle.parkingSlot', 'parkingSlot')
      .where('vehicle.societyId = :societyId', { societyId });

    // Scope for residents/tenants
    if (RESIDENT_ROLES.includes(user.role)) {
      qb.andWhere('vehicle.userId = :userId', { userId: user.sub });
    } else if (query.unitId) {
      qb.andWhere('vehicle.unitId = :unitId', { unitId: query.unitId });
    }

    if (query.vehicleType) {
      qb.andWhere('vehicle.vehicleType = :vehicleType', { vehicleType: query.vehicleType });
    }

    if (query.verificationStatus) {
      qb.andWhere('vehicle.verificationStatus = :vStatus', { vStatus: query.verificationStatus });
    }

    if (query.isActive !== undefined) {
      qb.andWhere('vehicle.isActive = :isActive', { isActive: query.isActive });
    }

    if (query.search) {
      const s = `%${query.search.trim()}%`;
      qb.andWhere(
        '(vehicle.registrationNumber ILIKE :s OR vehicle.makeModel ILIKE :s OR vehicle.rfidTag ILIKE :s)',
        { s },
      );
    }

    qb.orderBy('vehicle.createdAt', 'DESC');

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  /**
   * Find vehicle by ID with security checks.
   */
  async findVehicleById(user: AuthUser, id: string): Promise<Vehicle> {
    const societyId = this.getSocietyId(user);
    const vehicle = await this.vehicleRepo.findOne({
      where: { id, societyId },
      relations: ['unit', 'user', 'parkingSlot'],
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    if (RESIDENT_ROLES.includes(user.role) && vehicle.userId !== user.sub) {
      throw new ForbiddenException('You do not have permission to view this vehicle');
    }

    return vehicle;
  }

  /**
   * Update vehicle information.
   */
  async updateVehicle(user: AuthUser, id: string, dto: UpdateVehicleDto): Promise<Vehicle> {
    const vehicle = await this.findVehicleById(user, id);

    if (dto.vehicleType !== undefined) vehicle.vehicleType = dto.vehicleType;
    if (dto.makeModel !== undefined) vehicle.makeModel = dto.makeModel;
    if (dto.color !== undefined) vehicle.color = dto.color;
    if (dto.rfidTag !== undefined) vehicle.rfidTag = dto.rfidTag ? dto.rfidTag.trim().toUpperCase() : null;
    if (dto.fastagNumber !== undefined) vehicle.fastagNumber = dto.fastagNumber ? dto.fastagNumber.trim().toUpperCase() : null;
    if (dto.rcDocumentUrl !== undefined) vehicle.rcDocumentUrl = dto.rcDocumentUrl;
    if (dto.insuranceDocumentUrl !== undefined) vehicle.insuranceDocumentUrl = dto.insuranceDocumentUrl;
    if (dto.insuranceExpiryDate !== undefined) {
      vehicle.insuranceExpiryDate = dto.insuranceExpiryDate ? new Date(dto.insuranceExpiryDate) : null;
    }
    if (dto.isActive !== undefined) vehicle.isActive = dto.isActive;

    return this.vehicleRepo.save(vehicle);
  }

  /**
   * Verify or reject vehicle registration documents (Admin only).
   */
  async verifyVehicle(user: AuthUser, id: string, dto: VerifyVehicleDto): Promise<Vehicle> {
    const vehicle = await this.findVehicleById(user, id);

    if (dto.status === VehicleVerificationStatus.REJECTED && !dto.rejectionReason?.trim()) {
      throw new BadRequestException('rejectionReason is mandatory when rejecting vehicle registration');
    }

    vehicle.verificationStatus = dto.status;
    vehicle.verifiedByUserId = user.sub;
    vehicle.verifiedAt = new Date();
    vehicle.rejectionReason = dto.status === VehicleVerificationStatus.REJECTED ? dto.rejectionReason!.trim() : null;

    const saved = await this.vehicleRepo.save(vehicle);

    // Send notification to vehicle owner
    try {
      const isApproved = dto.status === VehicleVerificationStatus.VERIFIED;
      await this.notificationsService.send({
        userId: vehicle.userId,
        societyId: this.getSocietyId(user),
        type: NotificationType.GENERAL,
        channel: NotificationChannel.IN_APP,
        subject: isApproved
          ? `✅ Vehicle Verified: ${vehicle.registrationNumber}`
          : `⚠️ Vehicle Registration Rejected: ${vehicle.registrationNumber}`,
        body: isApproved
          ? `Your vehicle ${vehicle.registrationNumber} has been verified by the society administration.`
          : `Your vehicle ${vehicle.registrationNumber} was rejected. Reason: ${vehicle.rejectionReason}`,
        payload: { vehicleId: vehicle.id, status: vehicle.verificationStatus },
      });
    } catch (err) {
      this.logger.warn(`Failed to send vehicle verification notification: ${err}`);
    }

    return saved;
  }

  /**
   * Deactivate / soft delete vehicle.
   */
  async deleteVehicle(user: AuthUser, id: string): Promise<{ success: boolean }> {
    const vehicle = await this.findVehicleById(user, id);
    vehicle.isActive = false;
    await this.vehicleRepo.save(vehicle);
    await this.vehicleRepo.softDelete(id);
    return { success: true };
  }

  /**
   * Lookup vehicle by plate number, RFID tag, or Fastag (Gate security / admin).
   */
  async lookupVehicle(user: AuthUser, identifier: string): Promise<Vehicle | null> {
    const societyId = this.getSocietyId(user);
    const cleanId = identifier.trim().toUpperCase();

    const vehicle = await this.vehicleRepo
      .createQueryBuilder('vehicle')
      .leftJoinAndSelect('vehicle.unit', 'unit')
      .leftJoinAndSelect('vehicle.user', 'user')
      .leftJoinAndSelect('vehicle.parkingSlot', 'parkingSlot')
      .where('vehicle.societyId = :societyId', { societyId })
      .andWhere('vehicle.isActive = true')
      .andWhere(
        '(vehicle.registrationNumber = :cleanId OR vehicle.rfidTag = :cleanId OR vehicle.fastagNumber = :cleanId)',
        { cleanId },
      )
      .getOne();

    if (!vehicle) {
      throw new NotFoundException(`No active vehicle found matching "${identifier}"`);
    }

    return vehicle;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🅿️ PARKING SLOTS MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create a single parking slot.
   */
  async createSlot(user: AuthUser, dto: CreateParkingSlotDto): Promise<ParkingSlot> {
    const societyId = this.getSocietyId(user);
    const slotNumber = dto.slotNumber.trim().toUpperCase();

    const existing = await this.slotRepo.findOne({
      where: { societyId, slotNumber },
    });

    if (existing) {
      throw new ConflictException(`Parking slot "${slotNumber}" already exists in this society`);
    }

    const slot = this.slotRepo.create({
      societyId,
      slotNumber,
      towerId: dto.towerId ?? null,
      floor: dto.floor?.trim() ?? null,
      slotType: dto.slotType,
      status: ParkingSlotStatus.AVAILABLE,
      isVisitorSlot: dto.isVisitorSlot ?? false,
      notes: dto.notes?.trim() ?? null,
    });

    return this.slotRepo.save(slot);
  }

  /**
   * Bulk create parking slots (e.g. B1-1 to B1-50).
   */
  async bulkCreateSlots(
    user: AuthUser,
    dto: BulkCreateSlotsDto,
  ): Promise<{ created: number; skipped: number }> {
    const societyId = this.getSocietyId(user);
    if (dto.fromNumber > dto.toNumber) {
      throw new BadRequestException('fromNumber must be less than or equal to toNumber');
    }

    const totalToGenerate = dto.toNumber - dto.fromNumber + 1;
    if (totalToGenerate > 200) {
      throw new BadRequestException('Cannot generate more than 200 parking slots in a single batch');
    }

    const prefix = dto.prefix.trim().toUpperCase();
    const candidateNumbers = Array.from(
      { length: totalToGenerate },
      (_, i) => `${prefix}${dto.fromNumber + i}`,
    );

    const existingSlots = await this.slotRepo.find({
      where: {
        societyId,
        slotNumber: In(candidateNumbers),
      },
      select: ['slotNumber'],
    });

    const existingSet = new Set(existingSlots.map((s) => s.slotNumber));
    const toCreate: ParkingSlot[] = [];

    for (const num of candidateNumbers) {
      if (!existingSet.has(num)) {
        toCreate.push(
          this.slotRepo.create({
            societyId,
            slotNumber: num,
            towerId: dto.towerId ?? null,
            floor: dto.floor?.trim() ?? null,
            slotType: dto.slotType,
            status: ParkingSlotStatus.AVAILABLE,
            isVisitorSlot: dto.isVisitorSlot ?? false,
          }),
        );
      }
    }

    if (toCreate.length > 0) {
      await this.slotRepo.save(toCreate);
    }

    return {
      created: toCreate.length,
      skipped: candidateNumbers.length - toCreate.length,
    };
  }

  /**
   * Find parking slots with filters and pagination.
   */
  async findSlots(
    user: AuthUser,
    query: ParkingSlotQueryDto,
  ): Promise<{ data: ParkingSlot[]; total: number; page: number; limit: number }> {
    const societyId = this.getSocietyId(user);
    const qb = this.slotRepo
      .createQueryBuilder('slot')
      .leftJoinAndSelect('slot.tower', 'tower')
      .where('slot.societyId = :societyId', { societyId });

    if (query.status) {
      qb.andWhere('slot.status = :status', { status: query.status });
    }

    if (query.slotType) {
      qb.andWhere('slot.slotType = :slotType', { slotType: query.slotType });
    }

    if (query.isVisitorSlot !== undefined) {
      qb.andWhere('slot.isVisitorSlot = :isVisitor', { isVisitor: query.isVisitorSlot });
    }

    if (query.towerId) {
      qb.andWhere('slot.towerId = :towerId', { towerId: query.towerId });
    }

    if (query.search) {
      const s = `%${query.search.trim()}%`;
      qb.andWhere('(slot.slotNumber ILIKE :s OR slot.floor ILIKE :s)', { s });
    }

    qb.orderBy('slot.slotNumber', 'ASC');

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  /**
   * Get single slot by ID.
   */
  async findSlotById(user: AuthUser, id: string): Promise<ParkingSlot> {
    const societyId = this.getSocietyId(user);
    const slot = await this.slotRepo.findOne({
      where: { id, societyId },
      relations: ['tower'],
    });

    if (!slot) {
      throw new NotFoundException(`Parking slot with ID ${id} not found`);
    }

    return slot;
  }

  /**
   * Update parking slot properties.
   */
  async updateSlot(user: AuthUser, id: string, dto: UpdateParkingSlotDto): Promise<ParkingSlot> {
    const societyId = this.getSocietyId(user);
    const slot = await this.findSlotById(user, id);

    if (dto.slotNumber) {
      const newNum = dto.slotNumber.trim().toUpperCase();
      if (newNum !== slot.slotNumber) {
        const conflict = await this.slotRepo.findOne({
          where: { societyId, slotNumber: newNum },
        });
        if (conflict) {
          throw new ConflictException(`Slot number "${newNum}" is already in use`);
        }
        slot.slotNumber = newNum;
      }
    }

    if (dto.towerId !== undefined) slot.towerId = dto.towerId;
    if (dto.floor !== undefined) slot.floor = dto.floor;
    if (dto.slotType !== undefined) slot.slotType = dto.slotType;
    if (dto.status !== undefined) slot.status = dto.status;
    if (dto.isVisitorSlot !== undefined) slot.isVisitorSlot = dto.isVisitorSlot;
    if (dto.notes !== undefined) slot.notes = dto.notes;

    return this.slotRepo.save(slot);
  }

  /**
   * Delete parking slot (soft delete).
   */
  async deleteSlot(user: AuthUser, id: string): Promise<{ success: boolean }> {
    const slot = await this.findSlotById(user, id);

    if (slot.status === ParkingSlotStatus.ALLOCATED) {
      throw new BadRequestException('Cannot delete an allocated parking slot. Please release the allocation first.');
    }

    await this.slotRepo.softDelete(id);
    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📋 PARKING ALLOCATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Allocate parking slot to a unit and optional vehicle.
   */
  async allocateSlot(user: AuthUser, dto: AllocateSlotDto): Promise<ParkingAllocation> {
    const societyId = this.getSocietyId(user);
    const slot = await this.findSlotById(user, dto.slotId);

    if (slot.status === ParkingSlotStatus.ALLOCATED) {
      throw new ConflictException(`Slot "${slot.slotNumber}" is already allocated`);
    }

    if (slot.status === ParkingSlotStatus.BLOCKED || slot.status === ParkingSlotStatus.MAINTENANCE) {
      throw new BadRequestException(`Slot "${slot.slotNumber}" is currently in ${slot.status} state and cannot be allocated`);
    }

    let vehicle: Vehicle | null = null;
    if (dto.vehicleId) {
      vehicle = await this.vehicleRepo.findOne({
        where: { id: dto.vehicleId, societyId, isActive: true },
      });
      if (!vehicle) {
        throw new NotFoundException(`Vehicle with ID ${dto.vehicleId} not found`);
      }
    }

    const allocation = this.allocationRepo.create({
      societyId,
      slotId: slot.id,
      unitId: dto.unitId,
      residentId: dto.residentId ?? null,
      vehicleId: dto.vehicleId ?? null,
      allocationType: dto.allocationType,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      monthlyFee: dto.monthlyFee ?? 0,
      isActive: true,
      notes: dto.notes?.trim() ?? null,
    });

    const savedAllocation = await this.allocationRepo.save(allocation);

    slot.status = ParkingSlotStatus.ALLOCATED;
    await this.slotRepo.save(slot);

    if (vehicle) {
      vehicle.parkingSlotId = slot.id;
      await this.vehicleRepo.save(vehicle);
    }

    this.logger.log(`Slot ${slot.slotNumber} allocated to unit ${dto.unitId}`);
    return savedAllocation;
  }

  /**
   * List parking allocations (scoped to unit for residents).
   */
  async findAllocations(user: AuthUser, unitId?: string): Promise<ParkingAllocation[]> {
    const societyId = this.getSocietyId(user);
    const qb = this.allocationRepo
      .createQueryBuilder('allocation')
      .leftJoinAndSelect('allocation.slot', 'slot')
      .leftJoinAndSelect('allocation.unit', 'unit')
      .leftJoinAndSelect('allocation.vehicle', 'vehicle')
      .where('allocation.societyId = :societyId', { societyId });

    if (RESIDENT_ROLES.includes(user.role)) {
      const resident = await this.residentRepo.findOne({
        where: { userId: user.sub, societyId, isActive: true },
      });
      if (!resident) {
        return [];
      }
      qb.andWhere('allocation.unitId = :residentUnitId', { residentUnitId: resident.unitId });
    } else if (unitId) {
      qb.andWhere('allocation.unitId = :unitId', { unitId });
    }

    qb.orderBy('allocation.createdAt', 'DESC');
    return qb.getMany();
  }

  /**
   * Release active allocation and mark slot available.
   */
  async releaseAllocation(user: AuthUser, allocationId: string): Promise<ParkingAllocation> {
    const societyId = this.getSocietyId(user);
    const allocation = await this.allocationRepo.findOne({
      where: { id: allocationId, societyId },
      relations: ['slot', 'vehicle'],
    });

    if (!allocation) {
      throw new NotFoundException(`Allocation with ID ${allocationId} not found`);
    }

    if (!allocation.isActive) {
      throw new BadRequestException('Allocation is already released');
    }

    allocation.isActive = false;
    allocation.endDate = new Date();
    await this.allocationRepo.save(allocation);

    // Free up slot
    if (allocation.slot) {
      allocation.slot.status = ParkingSlotStatus.AVAILABLE;
      await this.slotRepo.save(allocation.slot);
    }

    // Unlink vehicle if attached
    if (allocation.vehicle) {
      allocation.vehicle.parkingSlotId = null;
      await this.vehicleRepo.save(allocation.vehicle);
    }

    this.logger.log(`Released parking allocation ${allocationId}`);
    return allocation;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔄 PARKING TRANSFERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Request parking transfer to another unit.
   */
  async requestTransfer(user: AuthUser, dto: CreateTransferRequestDto): Promise<ParkingTransfer> {
    const societyId = this.getSocietyId(user);

    // Check active allocation for this slot
    const activeAlloc = await this.allocationRepo.findOne({
      where: { slotId: dto.slotId, societyId, isActive: true },
    });

    if (!activeAlloc) {
      throw new BadRequestException('Cannot request transfer for an unallocated parking slot');
    }

    if (RESIDENT_ROLES.includes(user.role)) {
      const resident = await this.residentRepo.findOne({
        where: { userId: user.sub, societyId, isActive: true },
      });
      if (!resident || resident.unitId !== activeAlloc.unitId) {
        throw new ForbiddenException('You can only transfer slots allocated to your own unit');
      }
    }

    if (activeAlloc.unitId === dto.toUnitId) {
      throw new BadRequestException('Source and destination units cannot be identical');
    }

    const transfer = this.transferRepo.create({
      societyId,
      slotId: dto.slotId,
      fromUnitId: activeAlloc.unitId,
      toUnitId: dto.toUnitId,
      requestedByUserId: user.sub,
      status: TransferStatus.PENDING,
      reason: dto.reason.trim(),
    });

    return this.transferRepo.save(transfer);
  }

  /**
   * List transfer requests.
   */
  async findTransfers(user: AuthUser, status?: TransferStatus): Promise<ParkingTransfer[]> {
    const societyId = this.getSocietyId(user);
    const qb = this.transferRepo
      .createQueryBuilder('transfer')
      .leftJoinAndSelect('transfer.slot', 'slot')
      .leftJoinAndSelect('transfer.fromUnit', 'fromUnit')
      .leftJoinAndSelect('transfer.toUnit', 'toUnit')
      .leftJoinAndSelect('transfer.requestedByUser', 'user')
      .where('transfer.societyId = :societyId', { societyId });

    if (status) {
      qb.andWhere('transfer.status = :status', { status });
    }

    if (RESIDENT_ROLES.includes(user.role)) {
      const resident = await this.residentRepo.findOne({
        where: { userId: user.sub, societyId, isActive: true },
      });
      if (!resident) return [];
      qb.andWhere('(transfer.fromUnitId = :unitId OR transfer.toUnitId = :unitId)', {
        unitId: resident.unitId,
      });
    }

    qb.orderBy('transfer.createdAt', 'DESC');
    return qb.getMany();
  }

  /**
   * Approve or reject a parking transfer (Admin/FacilityManager).
   */
  async actionTransfer(
    user: AuthUser,
    transferId: string,
    dto: ActionTransferDto,
  ): Promise<ParkingTransfer> {
    const societyId = this.getSocietyId(user);
    const transfer = await this.transferRepo.findOne({
      where: { id: transferId, societyId },
      relations: ['slot'],
    });

    if (!transfer) {
      throw new NotFoundException(`Transfer request ${transferId} not found`);
    }

    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException(`Transfer request is already ${transfer.status}`);
    }

    transfer.status = dto.status;
    transfer.adminNotes = dto.adminNotes?.trim() ?? null;
    transfer.approvedByUserId = user.sub;
    transfer.approvedAt = new Date();

    if (dto.status === TransferStatus.APPROVED) {
      // Deactivate current active allocation for fromUnit
      const currentAlloc = await this.allocationRepo.findOne({
        where: { slotId: transfer.slotId, unitId: transfer.fromUnitId, isActive: true },
      });
      if (currentAlloc) {
        currentAlloc.isActive = false;
        currentAlloc.endDate = new Date();
        await this.allocationRepo.save(currentAlloc);
      }

      // Create new allocation for toUnit
      const newAlloc = this.allocationRepo.create({
        societyId,
        slotId: transfer.slotId,
        unitId: transfer.toUnitId,
        allocationType: AllocationType.PRIMARY,
        startDate: new Date(),
        isActive: true,
        notes: `Transferred from unit ${transfer.fromUnitId}`,
      });
      await this.allocationRepo.save(newAlloc);
    }

    const saved = await this.transferRepo.save(transfer);

    // Notify requester
    try {
      await this.notificationsService.send({
        userId: transfer.requestedByUserId,
        societyId,
        type: NotificationType.GENERAL,
        channel: NotificationChannel.IN_APP,
        subject: dto.status === TransferStatus.APPROVED
          ? '🎉 Parking Slot Transfer Approved'
          : '❌ Parking Slot Transfer Rejected',
        body: dto.status === TransferStatus.APPROVED
          ? `Your parking slot transfer request for slot ${transfer.slot?.slotNumber ?? ''} has been approved.`
          : `Your parking slot transfer request was rejected. Notes: ${dto.adminNotes ?? 'None provided'}`,
        payload: { transferId: transfer.id, status: transfer.status },
      });
    } catch (err) {
      this.logger.warn(`Failed to notify transfer requester: ${err}`);
    }

    return saved;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🚖 VISITOR PARKING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Assign visitor parking slot (Security Guard or Admin at gate).
   */
  async assignVisitorParking(
    user: AuthUser,
    dto: AssignVisitorParkingDto,
  ): Promise<{ slot: ParkingSlot; allocation: ParkingAllocation }> {
    const societyId = this.getSocietyId(user);
    let slot: ParkingSlot | null = null;

    if (dto.slotId) {
      slot = await this.slotRepo.findOne({
        where: {
          id: dto.slotId,
          societyId,
          isVisitorSlot: true,
          status: ParkingSlotStatus.AVAILABLE,
        },
      });
      if (!slot) {
        throw new BadRequestException('Selected visitor slot is invalid or not currently available');
      }
    } else {
      slot = await this.slotRepo.findOne({
        where: {
          societyId,
          isVisitorSlot: true,
          status: ParkingSlotStatus.AVAILABLE,
        },
        order: { slotNumber: 'ASC' },
      });
      if (!slot) {
        throw new NotFoundException('No available visitor parking slots found in this society');
      }
    }

    const regPlate = dto.vehicleRegistration.replace(/\s+/g, '').toUpperCase();

    const allocation = this.allocationRepo.create({
      societyId,
      slotId: slot.id,
      unitId: dto.unitVisitedId,
      allocationType: AllocationType.VISITOR,
      startDate: new Date(),
      isActive: true,
      notes: `Visitor vehicle: ${regPlate}${dto.visitorName ? ` (${dto.visitorName})` : ''}. ${dto.notes ?? ''}`.trim(),
    });

    const savedAllocation = await this.allocationRepo.save(allocation);

    slot.status = ParkingSlotStatus.ALLOCATED;
    await this.slotRepo.save(slot);

    this.logger.log(`Visitor parking assigned: Slot ${slot.slotNumber} for vehicle ${regPlate}`);
    return { slot, allocation: savedAllocation };
  }

  /**
   * Release visitor parking slot.
   */
  async releaseVisitorParking(
    user: AuthUser,
    slotId: string,
  ): Promise<{ slot: ParkingSlot; allocation: ParkingAllocation }> {
    const societyId = this.getSocietyId(user);
    const slot = await this.findSlotById(user, slotId);

    const activeAlloc = await this.allocationRepo.findOne({
      where: {
        slotId: slot.id,
        societyId,
        allocationType: AllocationType.VISITOR,
        isActive: true,
      },
    });

    if (!activeAlloc) {
      throw new NotFoundException(`No active visitor parking allocation found for slot ${slot.slotNumber}`);
    }

    activeAlloc.isActive = false;
    activeAlloc.endDate = new Date();
    await this.allocationRepo.save(activeAlloc);

    slot.status = ParkingSlotStatus.AVAILABLE;
    await this.slotRepo.save(slot);

    this.logger.log(`Visitor parking slot ${slot.slotNumber} released`);
    return { slot, allocation: activeAlloc };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📊 PARKING ANALYTICS & DASHBOARD METRICS
  // ═══════════════════════════════════════════════════════════════════════════

  async getParkingAnalytics(user: AuthUser): Promise<{
    slots: {
      total: number;
      available: number;
      allocated: number;
      blocked: number;
      maintenance: number;
      visitorTotal: number;
      visitorAvailable: number;
      visitorOccupied: number;
      byType: Record<string, number>;
      occupancyRate: number;
    };
    vehicles: {
      total: number;
      verified: number;
      pending: number;
      rejected: number;
      byType: Record<string, number>;
    };
  }> {
    const societyId = this.getSocietyId(user);

    const [slots, totalSlots] = await this.slotRepo.findAndCount({ where: { societyId } });
    const [vehicles, totalVehicles] = await this.vehicleRepo.findAndCount({
      where: { societyId, isActive: true },
    });

    let available = 0;
    let allocated = 0;
    let blocked = 0;
    let maintenance = 0;
    let visitorTotal = 0;
    let visitorAvailable = 0;
    let visitorOccupied = 0;
    const slotByType: Record<string, number> = {};

    for (const s of slots) {
      if (s.status === ParkingSlotStatus.AVAILABLE) available++;
      else if (s.status === ParkingSlotStatus.ALLOCATED) allocated++;
      else if (s.status === ParkingSlotStatus.BLOCKED) blocked++;
      else if (s.status === ParkingSlotStatus.MAINTENANCE) maintenance++;

      if (s.isVisitorSlot) {
        visitorTotal++;
        if (s.status === ParkingSlotStatus.AVAILABLE) visitorAvailable++;
        else visitorOccupied++;
      }

      slotByType[s.slotType] = (slotByType[s.slotType] || 0) + 1;
    }

    let verifiedVehicles = 0;
    let pendingVehicles = 0;
    let rejectedVehicles = 0;
    const vehicleByType: Record<string, number> = {};

    for (const v of vehicles) {
      if (v.verificationStatus === VehicleVerificationStatus.VERIFIED) verifiedVehicles++;
      else if (v.verificationStatus === VehicleVerificationStatus.PENDING) pendingVehicles++;
      else if (v.verificationStatus === VehicleVerificationStatus.REJECTED) rejectedVehicles++;

      vehicleByType[v.vehicleType] = (vehicleByType[v.vehicleType] || 0) + 1;
    }

    const occupancyRate = totalSlots > 0 ? Number(((allocated / totalSlots) * 100).toFixed(1)) : 0;

    return {
      slots: {
        total: totalSlots,
        available,
        allocated,
        blocked,
        maintenance,
        visitorTotal,
        visitorAvailable,
        visitorOccupied,
        byType: slotByType,
        occupancyRate,
      },
      vehicles: {
        total: totalVehicles,
        verified: verifiedVehicles,
        pending: pendingVehicles,
        rejected: rejectedVehicles,
        byType: vehicleByType,
      },
    };
  }
}
