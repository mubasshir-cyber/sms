jest.mock('@nestjs/bullmq', () => ({
  InjectQueue: () => () => {},
  Processor: () => () => {},
  WorkerHost: class {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { DeliveriesController } from './deliveries.controller';
import { DeliveriesService } from './deliveries.service';
import { DeliveryType, DeliveryStatus } from '../../common/enums/delivery.enum';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

describe('DeliveriesController', () => {
  let controller: DeliveriesController;
  let service: any;

  const mockSocietyId = '11111111-1111-1111-1111-111111111111';
  const mockUnitId = '22222222-2222-2222-2222-222222222222';
  const mockGuardUser: AuthUser = {
    sub: '44444444-4444-4444-4444-444444444444',
    email: 'guard@example.com',
    role: Role.SECURITY_GUARD,
    societyId: mockSocietyId,
  };
  const mockResidentUser: AuthUser = {
    sub: '55555555-5555-5555-5555-555555555555',
    email: 'resident@example.com',
    role: Role.RESIDENT,
    societyId: mockSocietyId,
    unitId: mockUnitId,
  };

  const mockDelivery = {
    id: '66666666-6666-6666-6666-666666666666',
    societyId: mockSocietyId,
    unitId: mockUnitId,
    deliveryType: DeliveryType.ECOMMERCE,
    company: 'Amazon',
    status: DeliveryStatus.PENDING_PICKUP,
    pickupOtp: '123456',
  };

  beforeEach(async () => {
    service = {
      createDelivery: jest.fn().mockResolvedValue(mockDelivery),
      preApproveDelivery: jest.fn().mockResolvedValue(mockDelivery),
      findDeliveries: jest.fn().mockResolvedValue({ data: [mockDelivery], total: 1, page: 1, limit: 20 }),
      findPendingDeliveries: jest.fn().mockResolvedValue([mockDelivery]),
      findUnattendedDeliveries: jest.fn().mockResolvedValue([mockDelivery]),
      findMyDeliveries: jest.fn().mockResolvedValue([mockDelivery]),
      findDeliveryById: jest.fn().mockResolvedValue(mockDelivery),
      verifyPickupOtp: jest.fn().mockResolvedValue({ valid: true, message: 'OTP verified successfully' }),
      collectDelivery: jest.fn().mockResolvedValue({ ...mockDelivery, status: DeliveryStatus.COLLECTED }),
      allowDirectEntry: jest.fn().mockResolvedValue({ ...mockDelivery, status: DeliveryStatus.DELIVERED_TO_UNIT }),
      returnDelivery: jest.fn().mockResolvedValue({ ...mockDelivery, status: DeliveryStatus.RETURNED }),
      updateDelivery: jest.fn().mockResolvedValue(mockDelivery),
      deleteDelivery: jest.fn().mockResolvedValue({ success: true }),
      getAnalytics: jest.fn().mockResolvedValue({
        todayTotal: 10,
        pendingPickup: 3,
        todayCollected: 7,
        todayDirectEntry: 2,
        unattendedCount: 0,
        byType: { ecommerce: 5, food: 5 },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeliveriesController],
      providers: [{ provide: DeliveriesService, useValue: service }],
    }).compile();

    controller = module.get<DeliveriesController>(DeliveriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createDelivery', () => {
    it('should create delivery via service', async () => {
      const dto = {
        unitId: mockUnitId,
        gateId: '33333333-3333-3333-3333-333333333333',
        deliveryType: DeliveryType.ECOMMERCE,
        company: 'Amazon',
      };
      const res = await controller.createDelivery(mockGuardUser, dto);
      expect(service.createDelivery).toHaveBeenCalledWith(mockGuardUser, dto);
      expect(res).toEqual(mockDelivery);
    });
  });

  describe('findDeliveries', () => {
    it('should return deliveries query result', async () => {
      const res = await controller.findDeliveries(mockResidentUser, { page: 1, limit: 10 });
      expect(service.findDeliveries).toHaveBeenCalled();
      expect(res.data).toHaveLength(1);
    });
  });

  describe('verifyPickupOtp', () => {
    it('should verify OTP through service', async () => {
      const res = await controller.verifyPickupOtp(mockGuardUser, mockDelivery.id, { otp: '123456' });
      expect(service.verifyPickupOtp).toHaveBeenCalledWith(mockGuardUser, mockDelivery.id, { otp: '123456' });
      expect(res.valid).toBe(true);
    });
  });

  describe('collectDelivery', () => {
    it('should collect delivery through service', async () => {
      const res = await controller.collectDelivery(mockGuardUser, mockDelivery.id, { pickupOtp: '123456' });
      expect(service.collectDelivery).toHaveBeenCalledWith(mockGuardUser, mockDelivery.id, { pickupOtp: '123456' });
      expect(res.status).toBe(DeliveryStatus.COLLECTED);
    });
  });

  describe('getAnalytics', () => {
    it('should return metrics summary', async () => {
      const res = await controller.getAnalytics(mockGuardUser);
      expect(res.todayTotal).toBe(10);
      expect(res.pendingPickup).toBe(3);
    });
  });
});
