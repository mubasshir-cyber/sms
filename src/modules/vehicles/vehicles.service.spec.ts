jest.mock('@nestjs/bullmq', () => ({
  InjectQueue: () => () => {},
  Processor: () => () => {},
  WorkerHost: class {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { Vehicle } from './entities/vehicle.entity';
import { ParkingSlot } from './entities/parking-slot.entity';
import { ParkingAllocation } from './entities/parking-allocation.entity';
import { ParkingTransfer } from './entities/parking-transfer.entity';
import { Resident } from '../residents/entities/resident.entity';
import { NotificationsService } from '../notifications/notifications.service';
import {
  VehicleType,
  VehicleVerificationStatus,
  ParkingSlotType,
  ParkingSlotStatus,
  AllocationType,
  TransferStatus,
} from '../../common/enums/vehicle-parking.enum';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

describe('VehiclesService', () => {
  let service: VehiclesService;
  let vehicleRepo: any;
  let slotRepo: any;
  let allocationRepo: any;
  let transferRepo: any;
  let residentRepo: any;
  let notificationsService: any;

  const mockSocietyId = '11111111-1111-1111-1111-111111111111';
  const mockUnitId = '22222222-2222-2222-2222-222222222222';
  const mockUserId = '33333333-3333-3333-3333-333333333333';

  const mockAdminUser: AuthUser = {
    sub: mockUserId,
    email: 'admin@example.com',
    role: Role.SOCIETY_ADMIN,
    societyId: mockSocietyId,
  };

  const mockResidentUser: AuthUser = {
    sub: '44444444-4444-4444-4444-444444444444',
    email: 'resident@example.com',
    role: Role.RESIDENT,
    societyId: mockSocietyId,
  };

  const mockVehicle: Vehicle = {
    id: '55555555-5555-5555-5555-555555555555',
    societyId: mockSocietyId,
    unitId: mockUnitId,
    userId: mockResidentUser.sub,
    vehicleType: VehicleType.CAR,
    registrationNumber: 'MH02AB1234',
    makeModel: 'Tata Nexon',
    color: 'White',
    rfidTag: 'RFID-1234',
    fastagNumber: null,
    rcDocumentUrl: null,
    insuranceDocumentUrl: null,
    insuranceExpiryDate: null,
    verificationStatus: VehicleVerificationStatus.PENDING,
    verifiedByUserId: null,
    verifiedAt: null,
    rejectionReason: null,
    isActive: true,
    parkingSlotId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockSlot: ParkingSlot = {
    id: '66666666-6666-6666-6666-666666666666',
    societyId: mockSocietyId,
    towerId: null,
    slotNumber: 'B1-101',
    floor: 'Basement 1',
    slotType: ParkingSlotType.COVERED,
    status: ParkingSlotStatus.AVAILABLE,
    isVisitorSlot: false,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockAllocation: ParkingAllocation = {
    id: '77777777-7777-7777-7777-777777777777',
    societyId: mockSocietyId,
    slotId: mockSlot.id,
    unitId: mockUnitId,
    residentId: null,
    vehicleId: mockVehicle.id,
    allocationType: AllocationType.PRIMARY,
    startDate: new Date('2026-09-01'),
    endDate: null,
    monthlyFee: 0,
    isActive: true,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    vehicleRepo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'veh-new' })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      findOne: jest.fn(),
      findAndCount: jest.fn().mockResolvedValue([[mockVehicle], 1]),
      softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockVehicle], 1]),
        getOne: jest.fn().mockResolvedValue(mockVehicle),
      })),
    };

    slotRepo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'slot-new' })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      findAndCount: jest.fn().mockResolvedValue([[mockSlot], 1]),
      softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockSlot], 1]),
      })),
    };

    allocationRepo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'alloc-new' })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([mockAllocation]),
      createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAllocation]),
      })),
    };

    transferRepo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'trf-new' })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      })),
    };

    residentRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 'res-1',
        userId: mockResidentUser.sub,
        societyId: mockSocietyId,
        unitId: mockUnitId,
        isActive: true,
      }),
    };

    notificationsService = {
      send: jest.fn().mockResolvedValue({ id: 'notif-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        { provide: getRepositoryToken(Vehicle), useValue: vehicleRepo },
        { provide: getRepositoryToken(ParkingSlot), useValue: slotRepo },
        { provide: getRepositoryToken(ParkingAllocation), useValue: allocationRepo },
        { provide: getRepositoryToken(ParkingTransfer), useValue: transferRepo },
        { provide: getRepositoryToken(Resident), useValue: residentRepo },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerVehicle', () => {
    it('should successfully register a vehicle for a resident', async () => {
      vehicleRepo.findOne.mockResolvedValue(null);

      const result = await service.registerVehicle(mockResidentUser, {
        vehicleType: VehicleType.CAR,
        registrationNumber: 'MH 02 AB 1234',
        makeModel: 'Tata Nexon EV',
      });

      expect(result).toBeDefined();
      expect(vehicleRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          societyId: mockSocietyId,
          unitId: mockUnitId,
          registrationNumber: 'MH02AB1234',
          verificationStatus: VehicleVerificationStatus.PENDING,
        }),
      );
    });

    it('should throw ConflictException if vehicle with same registration exists', async () => {
      vehicleRepo.findOne.mockResolvedValue(mockVehicle);

      await expect(
        service.registerVehicle(mockResidentUser, {
          vehicleType: VehicleType.CAR,
          registrationNumber: 'MH02AB1234',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('verifyVehicle', () => {
    it('should approve vehicle and dispatch notification', async () => {
      vehicleRepo.findOne.mockResolvedValue({ ...mockVehicle });

      const result = await service.verifyVehicle(mockAdminUser, mockVehicle.id, {
        status: VehicleVerificationStatus.VERIFIED,
      });

      expect(result.verificationStatus).toBe(VehicleVerificationStatus.VERIFIED);
      expect(result.verifiedByUserId).toBe(mockAdminUser.sub);
      expect(notificationsService.send).toHaveBeenCalled();
    });

    it('should require rejectionReason when rejecting vehicle', async () => {
      vehicleRepo.findOne.mockResolvedValue({ ...mockVehicle });

      await expect(
        service.verifyVehicle(mockAdminUser, mockVehicle.id, {
          status: VehicleVerificationStatus.REJECTED,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createSlot', () => {
    it('should create a parking slot', async () => {
      slotRepo.findOne.mockResolvedValue(null);

      const result = await service.createSlot(mockAdminUser, {
        slotNumber: 'B1-101',
        floor: 'Basement 1',
        slotType: ParkingSlotType.COVERED,
      });

      expect(result).toBeDefined();
      expect(slotRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          slotNumber: 'B1-101',
          status: ParkingSlotStatus.AVAILABLE,
        }),
      );
    });

    it('should throw ConflictException on duplicate slotNumber', async () => {
      slotRepo.findOne.mockResolvedValue(mockSlot);

      await expect(
        service.createSlot(mockAdminUser, {
          slotNumber: 'B1-101',
          slotType: ParkingSlotType.COVERED,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('bulkCreateSlots', () => {
    it('should create multiple slots and skip existing ones', async () => {
      slotRepo.find.mockResolvedValue([{ slotNumber: 'B1-1' }]);

      const result = await service.bulkCreateSlots(mockAdminUser, {
        prefix: 'B1-',
        fromNumber: 1,
        toNumber: 5,
        slotType: ParkingSlotType.COVERED,
      });

      expect(result.created).toBe(4);
      expect(result.skipped).toBe(1);
    });
  });

  describe('allocateSlot', () => {
    it('should allocate slot to unit and mark slot allocated', async () => {
      slotRepo.findOne.mockResolvedValue({ ...mockSlot, status: ParkingSlotStatus.AVAILABLE });

      const result = await service.allocateSlot(mockAdminUser, {
        slotId: mockSlot.id,
        unitId: mockUnitId,
        allocationType: AllocationType.PRIMARY,
        startDate: '2026-09-01',
      });

      expect(result).toBeDefined();
      expect(allocationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          slotId: mockSlot.id,
          unitId: mockUnitId,
          isActive: true,
        }),
      );
      expect(slotRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: ParkingSlotStatus.ALLOCATED }),
      );
    });

    it('should throw ConflictException if slot is already allocated', async () => {
      slotRepo.findOne.mockResolvedValue({ ...mockSlot, status: ParkingSlotStatus.ALLOCATED });

      await expect(
        service.allocateSlot(mockAdminUser, {
          slotId: mockSlot.id,
          unitId: mockUnitId,
          allocationType: AllocationType.PRIMARY,
          startDate: '2026-09-01',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('releaseAllocation', () => {
    it('should mark allocation inactive and free slot', async () => {
      const activeAlloc = { ...mockAllocation, slot: { ...mockSlot, status: ParkingSlotStatus.ALLOCATED } };
      allocationRepo.findOne.mockResolvedValue(activeAlloc);

      const result = await service.releaseAllocation(mockAdminUser, mockAllocation.id);

      expect(result.isActive).toBe(false);
      expect(slotRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: ParkingSlotStatus.AVAILABLE }),
      );
    });
  });

  describe('requestTransfer and actionTransfer', () => {
    it('should allow resident to request transfer of own allocated slot', async () => {
      allocationRepo.findOne.mockResolvedValue({ ...mockAllocation, unitId: mockUnitId });

      const result = await service.requestTransfer(mockResidentUser, {
        slotId: mockSlot.id,
        toUnitId: '99999999-9999-9999-9999-999999999999',
        reason: 'Swapping slot with neighbor',
      });

      expect(result).toBeDefined();
      expect(transferRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          slotId: mockSlot.id,
          fromUnitId: mockUnitId,
          status: TransferStatus.PENDING,
        }),
      );
    });

    it('should approve transfer and reassign slot allocation', async () => {
      const mockTrf = {
        id: 'trf-1',
        societyId: mockSocietyId,
        slotId: mockSlot.id,
        fromUnitId: mockUnitId,
        toUnitId: '99999999-9999-9999-9999-999999999999',
        requestedByUserId: mockResidentUser.sub,
        status: TransferStatus.PENDING,
        slot: mockSlot,
      };
      transferRepo.findOne.mockResolvedValue(mockTrf);
      allocationRepo.findOne.mockResolvedValue({ ...mockAllocation });

      const result = await service.actionTransfer(mockAdminUser, 'trf-1', {
        status: TransferStatus.APPROVED,
        adminNotes: 'Approved by society committee',
      });

      expect(result.status).toBe(TransferStatus.APPROVED);
      expect(notificationsService.send).toHaveBeenCalled();
    });
  });

  describe('visitor parking', () => {
    it('should assign visitor slot at gate', async () => {
      const visitorSlot = { ...mockSlot, id: 'vis-slot-1', isVisitorSlot: true, status: ParkingSlotStatus.AVAILABLE };
      slotRepo.findOne.mockResolvedValue(visitorSlot);

      const result = await service.assignVisitorParking(mockAdminUser, {
        vehicleRegistration: 'DL01XY5555',
        unitVisitedId: mockUnitId,
        visitorName: 'Rajesh Sharma',
      });

      expect(result.slot.status).toBe(ParkingSlotStatus.ALLOCATED);
      expect(allocationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          allocationType: AllocationType.VISITOR,
          unitId: mockUnitId,
        }),
      );
    });
  });

  describe('getParkingAnalytics', () => {
    it('should compute slot occupancy and vehicle metrics', async () => {
      slotRepo.findAndCount.mockResolvedValue([
        [
          { ...mockSlot, status: ParkingSlotStatus.ALLOCATED, slotType: ParkingSlotType.COVERED },
          { ...mockSlot, id: 's2', status: ParkingSlotStatus.AVAILABLE, slotType: ParkingSlotType.OPEN },
        ],
        2,
      ]);
      vehicleRepo.findAndCount.mockResolvedValue([
        [
          { ...mockVehicle, verificationStatus: VehicleVerificationStatus.VERIFIED },
        ],
        1,
      ]);

      const analytics = await service.getParkingAnalytics(mockAdminUser);

      expect(analytics.slots.total).toBe(2);
      expect(analytics.slots.allocated).toBe(1);
      expect(analytics.slots.available).toBe(1);
      expect(analytics.slots.occupancyRate).toBe(50);
      expect(analytics.vehicles.total).toBe(1);
      expect(analytics.vehicles.verified).toBe(1);
    });
  });
});
