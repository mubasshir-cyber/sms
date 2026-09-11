jest.mock('@nestjs/bullmq', () => ({
  InjectQueue: () => () => {},
  Processor: () => () => {},
  WorkerHost: class {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
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

describe('VehiclesController', () => {
  let controller: VehiclesController;
  let service: any;

  const mockSocietyId = '11111111-1111-1111-1111-111111111111';
  const mockAdminUser: AuthUser = {
    sub: '22222222-2222-2222-2222-222222222222',
    email: 'admin@example.com',
    role: Role.SOCIETY_ADMIN,
    societyId: mockSocietyId,
  };

  const mockVehicle = {
    id: 'veh-1',
    registrationNumber: 'MH02AB1234',
    vehicleType: VehicleType.CAR,
    verificationStatus: VehicleVerificationStatus.VERIFIED,
  };

  const mockSlot = {
    id: 'slot-1',
    slotNumber: 'B1-101',
    status: ParkingSlotStatus.AVAILABLE,
  };

  beforeEach(async () => {
    service = {
      registerVehicle: jest.fn().mockResolvedValue(mockVehicle),
      findVehicles: jest.fn().mockResolvedValue({ data: [mockVehicle], total: 1, page: 1, limit: 20 }),
      lookupVehicle: jest.fn().mockResolvedValue(mockVehicle),
      findVehicleById: jest.fn().mockResolvedValue(mockVehicle),
      updateVehicle: jest.fn().mockResolvedValue(mockVehicle),
      verifyVehicle: jest.fn().mockResolvedValue({ ...mockVehicle, verificationStatus: VehicleVerificationStatus.VERIFIED }),
      deleteVehicle: jest.fn().mockResolvedValue({ success: true }),
      createSlot: jest.fn().mockResolvedValue(mockSlot),
      bulkCreateSlots: jest.fn().mockResolvedValue({ created: 10, skipped: 0 }),
      findSlots: jest.fn().mockResolvedValue({ data: [mockSlot], total: 1, page: 1, limit: 20 }),
      findSlotById: jest.fn().mockResolvedValue(mockSlot),
      updateSlot: jest.fn().mockResolvedValue(mockSlot),
      deleteSlot: jest.fn().mockResolvedValue({ success: true }),
      allocateSlot: jest.fn().mockResolvedValue({ id: 'alloc-1', slotId: mockSlot.id }),
      findAllocations: jest.fn().mockResolvedValue([]),
      releaseAllocation: jest.fn().mockResolvedValue({ id: 'alloc-1', isActive: false }),
      requestTransfer: jest.fn().mockResolvedValue({ id: 'trf-1', status: TransferStatus.PENDING }),
      findTransfers: jest.fn().mockResolvedValue([]),
      actionTransfer: jest.fn().mockResolvedValue({ id: 'trf-1', status: TransferStatus.APPROVED }),
      assignVisitorParking: jest.fn().mockResolvedValue({ slot: mockSlot, allocation: { id: 'vis-1' } }),
      releaseVisitorParking: jest.fn().mockResolvedValue({ slot: mockSlot, allocation: { id: 'vis-1', isActive: false } }),
      getParkingAnalytics: jest.fn().mockResolvedValue({
        slots: { total: 10, available: 5, allocated: 5, occupancyRate: 50 },
        vehicles: { total: 5, verified: 5, pending: 0 },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehiclesController],
      providers: [{ provide: VehiclesService, useValue: service }],
    }).compile();

    controller = module.get<VehiclesController>(VehiclesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should register a vehicle', async () => {
    const dto = { vehicleType: VehicleType.CAR, registrationNumber: 'MH02AB1234' };
    const result = await controller.registerVehicle(mockAdminUser, dto);
    expect(result).toEqual(mockVehicle);
    expect(service.registerVehicle).toHaveBeenCalledWith(mockAdminUser, dto);
  });

  it('should lookup a vehicle', async () => {
    const result = await controller.lookupVehicle(mockAdminUser, 'MH02AB1234');
    expect(result).toEqual(mockVehicle);
    expect(service.lookupVehicle).toHaveBeenCalledWith(mockAdminUser, 'MH02AB1234');
  });

  it('should verify a vehicle', async () => {
    const dto = { status: VehicleVerificationStatus.VERIFIED };
    const result = await controller.verifyVehicle(mockAdminUser, 'veh-1', dto);
    expect(result.verificationStatus).toBe(VehicleVerificationStatus.VERIFIED);
    expect(service.verifyVehicle).toHaveBeenCalledWith(mockAdminUser, 'veh-1', dto);
  });

  it('should create a parking slot', async () => {
    const dto = { slotNumber: 'B1-101', slotType: ParkingSlotType.COVERED, isVisitorSlot: false };
    const result = await controller.createSlot(mockAdminUser, dto);
    expect(result).toEqual(mockSlot);
    expect(service.createSlot).toHaveBeenCalledWith(mockAdminUser, dto);
  });

  it('should allocate a slot', async () => {
    const dto = {
      slotId: 'slot-1',
      unitId: 'unit-1',
      allocationType: AllocationType.PRIMARY,
      startDate: '2026-09-01',
    };
    const result = await controller.allocateSlot(mockAdminUser, dto);
    expect(result).toBeDefined();
    expect(service.allocateSlot).toHaveBeenCalledWith(mockAdminUser, dto);
  });

  it('should request and action a transfer', async () => {
    const reqDto = { slotId: 'slot-1', toUnitId: 'unit-2', reason: 'Mutual swap' };
    await controller.requestTransfer(mockAdminUser, reqDto);
    expect(service.requestTransfer).toHaveBeenCalledWith(mockAdminUser, reqDto);

    const actDto = { status: TransferStatus.APPROVED };
    await controller.actionTransfer(mockAdminUser, 'trf-1', actDto);
    expect(service.actionTransfer).toHaveBeenCalledWith(mockAdminUser, 'trf-1', actDto);
  });

  it('should assign and release visitor parking', async () => {
    const assignDto = { vehicleRegistration: 'MH02XY9999', unitVisitedId: 'unit-1' };
    await controller.assignVisitorParking(mockAdminUser, assignDto);
    expect(service.assignVisitorParking).toHaveBeenCalledWith(mockAdminUser, assignDto);

    await controller.releaseVisitorParking(mockAdminUser, 'slot-1');
    expect(service.releaseVisitorParking).toHaveBeenCalledWith(mockAdminUser, 'slot-1');
  });

  it('should return parking analytics', async () => {
    const result = await controller.getParkingAnalytics(mockAdminUser);
    expect(result.slots.occupancyRate).toBe(50);
    expect(service.getParkingAnalytics).toHaveBeenCalledWith(mockAdminUser);
  });
});
