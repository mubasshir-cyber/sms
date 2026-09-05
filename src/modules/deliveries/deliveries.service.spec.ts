jest.mock('@nestjs/bullmq', () => ({
  InjectQueue: () => () => {},
  Processor: () => () => {},
  WorkerHost: class {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeliveriesService } from './deliveries.service';
import { Delivery } from './entities/delivery.entity';
import { Gate } from '../visitors/entities/gate.entity';
import { Unit } from '../structure/entities/unit.entity';
import { Resident } from '../residents/entities/resident.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { DeliveryType, DeliveryStatus } from '../../common/enums/delivery.enum';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';

describe('DeliveriesService', () => {
  let service: DeliveriesService;
  let deliveriesRepo: any;
  let gatesRepo: any;
  let unitsRepo: any;
  let residentsRepo: any;
  let notificationsService: any;

  const mockSocietyId = '11111111-1111-1111-1111-111111111111';
  const mockUnitId = '22222222-2222-2222-2222-222222222222';
  const mockGateId = '33333333-3333-3333-3333-333333333333';
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

  const mockDelivery: Delivery = {
    id: '66666666-6666-6666-6666-666666666666',
    societyId: mockSocietyId,
    unitId: mockUnitId,
    recipientUserId: null,
    gateId: mockGateId,
    loggedByGuardId: mockGuardUser.sub,
    deliveryType: DeliveryType.ECOMMERCE,
    company: 'Amazon',
    deliveryPersonName: 'John Courier',
    deliveryPersonPhone: '+919999999999',
    vehicleNumber: 'DL 01 A 1111',
    trackingNumber: 'TRK12345',
    itemDescription: 'Electronics Box',
    photoUrl: 'https://example.com/photo.jpg',
    status: DeliveryStatus.PENDING_PICKUP,
    pickupOtp: '123456',
    passcode: null,
    leaveAtGate: true,
    arrivedAt: new Date(),
    collectedAt: null,
    collectedByUserId: null,
    collectedByGuardId: null,
    handoverPhotoUrl: null,
    notes: 'Fragile',
    isUnattendedAlertSent: false,
    unattendedAlertSentAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    deliveriesRepo = {
      create: jest.fn().mockImplementation(dto => ({ ...dto, id: mockDelivery.id })),
      save: jest.fn().mockImplementation(entity => Promise.resolve(entity)),
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      softRemove: jest.fn().mockResolvedValue({ success: true }),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockDelivery], 1]),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ type: 'ecommerce', count: '1' }]),
      }),
    };

    gatesRepo = {
      findOne: jest.fn().mockResolvedValue({ id: mockGateId, name: 'Main Gate 1', societyId: mockSocietyId }),
    };

    unitsRepo = {
      findOne: jest.fn().mockResolvedValue({ id: mockUnitId, unitNumber: '101', societyId: mockSocietyId }),
    };

    residentsRepo = {
      find: jest.fn().mockResolvedValue([{ userId: mockResidentUser.sub, unitId: mockUnitId }]),
    };

    notificationsService = {
      send: jest.fn().mockResolvedValue({ id: 'notif-1' }),
      sendBulk: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveriesService,
        { provide: getRepositoryToken(Delivery), useValue: deliveriesRepo },
        { provide: getRepositoryToken(Gate), useValue: gatesRepo },
        { provide: getRepositoryToken(Unit), useValue: unitsRepo },
        { provide: getRepositoryToken(Resident), useValue: residentsRepo },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get<DeliveriesService>(DeliveriesService);
  });

  describe('createDelivery', () => {
    it('should successfully create a pending delivery and notify residents', async () => {
      const result = await service.createDelivery(mockGuardUser, {
        unitId: mockUnitId,
        gateId: mockGateId,
        deliveryType: DeliveryType.ECOMMERCE,
        company: 'Amazon',
        leaveAtGate: true,
      });

      expect(result).toBeDefined();
      expect(result.status).toEqual(DeliveryStatus.PENDING_PICKUP);
      expect(result.pickupOtp).toHaveLength(6);
      expect(notificationsService.sendBulk).toHaveBeenCalled();
    });

    it('should throw NotFoundException if gate does not exist', async () => {
      gatesRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.createDelivery(mockGuardUser, {
          unitId: mockUnitId,
          gateId: 'invalid-gate',
          deliveryType: DeliveryType.ECOMMERCE,
          company: 'Amazon',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if unit does not exist', async () => {
      unitsRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.createDelivery(mockGuardUser, {
          unitId: 'invalid-unit',
          gateId: mockGateId,
          deliveryType: DeliveryType.ECOMMERCE,
          company: 'Amazon',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findDeliveries', () => {
    it('should return deliveries list scoped by role', async () => {
      const res = await service.findDeliveries(mockResidentUser, { page: 1, limit: 10 });
      expect(res.data).toHaveLength(1);
      expect(res.total).toBe(1);
    });
  });

  describe('verifyPickupOtp', () => {
    it('should return valid=true for correct OTP', async () => {
      deliveriesRepo.findOne.mockResolvedValueOnce({ ...mockDelivery });

      const res = await service.verifyPickupOtp(mockGuardUser, mockDelivery.id, { otp: '123456' });
      expect(res.valid).toBe(true);
      expect(res.message).toBe('OTP verified successfully');
    });

    it('should return valid=false for incorrect OTP', async () => {
      deliveriesRepo.findOne.mockResolvedValueOnce({ ...mockDelivery });

      const res = await service.verifyPickupOtp(mockGuardUser, mockDelivery.id, { otp: '999999' });
      expect(res.valid).toBe(false);
      expect(res.message).toBe('Incorrect OTP');
    });
  });

  describe('collectDelivery', () => {
    it('should mark delivery as collected and notify resident', async () => {
      deliveriesRepo.findOne.mockResolvedValueOnce({ ...mockDelivery });

      const res = await service.collectDelivery(mockGuardUser, mockDelivery.id, {
        pickupOtp: '123456',
        notes: 'Handed to resident',
      });

      expect(res.status).toBe(DeliveryStatus.COLLECTED);
      expect(res.collectedAt).toBeDefined();
      expect(notificationsService.sendBulk).toHaveBeenCalled();
    });

    it('should throw BadRequestException if wrong OTP is provided', async () => {
      deliveriesRepo.findOne.mockResolvedValueOnce({ ...mockDelivery });

      await expect(
        service.collectDelivery(mockGuardUser, mockDelivery.id, { pickupOtp: '000000' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('allowDirectEntry', () => {
    it('should update delivery status to DELIVERED_TO_UNIT and notify resident', async () => {
      deliveriesRepo.findOne.mockResolvedValueOnce({ ...mockDelivery });

      const res = await service.allowDirectEntry(mockGuardUser, mockDelivery.id, {
        notes: 'Swiggy rider going to flat',
      });

      expect(res.status).toBe(DeliveryStatus.DELIVERED_TO_UNIT);
      expect(res.leaveAtGate).toBe(false);
      expect(notificationsService.sendBulk).toHaveBeenCalled();
    });
  });

  describe('processUnattendedParcels', () => {
    it('should find unattended parcels and send reminder alerts', async () => {
      const unattendedDelivery = {
        ...mockDelivery,
        arrivedAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
        isUnattendedAlertSent: false,
      };
      deliveriesRepo.find.mockResolvedValueOnce([unattendedDelivery]);

      const res = await service.processUnattendedParcels();
      expect(res.processedCount).toBe(1);
      expect(unattendedDelivery.isUnattendedAlertSent).toBe(true);
      expect(notificationsService.sendBulk).toHaveBeenCalled();
    });
  });
});
