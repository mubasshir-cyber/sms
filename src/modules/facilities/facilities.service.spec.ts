jest.mock('@nestjs/bullmq', () => ({
  InjectQueue: () => () => {},
  Processor: () => () => {},
  WorkerHost: class {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { FacilitiesService } from './facilities.service';
import { Facility } from './entities/facility.entity';
import { FacilityBooking } from './entities/facility-booking.entity';
import { FacilityBookingStatusHistory } from './entities/facility-booking-status-history.entity';
import { Resident } from '../residents/entities/resident.entity';
import { NotificationsService } from '../notifications/notifications.service';
import {
  FacilityType,
  CapacityType,
  BookingSlotType,
  BookingStatus,
} from '../../common/enums/facility-booking.enum';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

describe('FacilitiesService', () => {
  let service: FacilitiesService;
  let facilityRepo: any;
  let bookingRepo: any;
  let historyRepo: any;
  let residentRepo: any;
  let dataSource: any;
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

  const mockFacility: Facility = {
    id: '55555555-5555-5555-5555-555555555555',
    societyId: mockSocietyId,
    name: 'Clubhouse Banquet Hall',
    facilityType: FacilityType.PARTY_HALL,
    capacityType: CapacityType.EXCLUSIVE,
    description: 'Hall description',
    location: '1st Floor',
    capacity: 100,
    rules: 'No loud music after 10 PM',
    imageUrls: [],
    bookingSlotType: BookingSlotType.HOURLY,
    slotDurationMinutes: 60,
    openTime: '06:00',
    closeTime: '22:00',
    bookingFee: 2000,
    depositFee: 3000,
    requiresApproval: true,
    maxBookingsPerMonthPerUnit: 2,
    advanceBookingDaysLimit: 30,
    cancellationHoursBefore: 24,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockBooking: FacilityBooking = {
    id: '66666666-6666-6666-6666-666666666666',
    societyId: mockSocietyId,
    facilityId: mockFacility.id,
    unitId: mockUnitId,
    userId: mockResidentUser.sub,
    bookingDate: '2026-10-15',
    startTime: '18:00',
    endTime: '20:00',
    attendeesCount: 20,
    status: BookingStatus.PENDING_APPROVAL,
    totalFee: 2000,
    depositFee: 3000,
    purpose: 'Birthday event',
    approvedByUserId: null,
    approvedAt: null,
    rejectionReason: null,
    cancellationReason: null,
    cancelledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    facilityRepo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'fac-new' })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      findOne: jest.fn(),
      findAndCount: jest.fn().mockResolvedValue([[mockFacility], 1]),
      softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockFacility], 1]),
      })),
    };

    bookingRepo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'book-new' })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([mockBooking]),
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockBooking], 1]),
      })),
    };

    historyRepo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'hist-new' })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      find: jest.fn().mockResolvedValue([]),
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

    dataSource = {
      transaction: jest.fn(async (cb) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockFacility),
          save: jest.fn().mockImplementation((cls, entity) => Promise.resolve({ ...entity, id: entity.id || 'new-id' })),
          create: jest.fn().mockImplementation((cls, dto) => ({ ...dto })),
          createQueryBuilder: jest.fn(() => ({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getCount: jest.fn().mockResolvedValue(0),
            getMany: jest.fn().mockResolvedValue([]),
          })),
        };
        return cb(mockManager);
      }),
    };

    notificationsService = {
      send: jest.fn().mockResolvedValue({ id: 'notif-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FacilitiesService,
        { provide: getRepositoryToken(Facility), useValue: facilityRepo },
        { provide: getRepositoryToken(FacilityBooking), useValue: bookingRepo },
        { provide: getRepositoryToken(FacilityBookingStatusHistory), useValue: historyRepo },
        { provide: getRepositoryToken(Resident), useValue: residentRepo },
        { provide: DataSource, useValue: dataSource },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get<FacilitiesService>(FacilitiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createFacility', () => {
    it('should create a facility successfully', async () => {
      facilityRepo.findOne.mockResolvedValue(null);

      const result = await service.createFacility(mockAdminUser, {
        name: 'Swimming Pool',
        facilityType: FacilityType.SWIMMING_POOL,
        capacityType: CapacityType.SHARED,
        capacity: 25,
        openTime: '06:00',
        closeTime: '21:00',
      });

      expect(result).toBeDefined();
      expect(facilityRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Swimming Pool',
          capacityType: CapacityType.SHARED,
          capacity: 25,
        }),
      );
    });

    it('should throw ConflictException on duplicate name', async () => {
      facilityRepo.findOne.mockResolvedValue(mockFacility);

      await expect(
        service.createFacility(mockAdminUser, {
          name: 'Clubhouse Banquet Hall',
          facilityType: FacilityType.PARTY_HALL,
          capacity: 50,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if openTime >= closeTime', async () => {
      facilityRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createFacility(mockAdminUser, {
          name: 'Gym',
          facilityType: FacilityType.GYM,
          capacity: 20,
          openTime: '22:00',
          closeTime: '06:00',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('checkAvailability', () => {
    it('should compute available slots correctly', async () => {
      facilityRepo.findOne.mockResolvedValue(mockFacility);
      bookingRepo.find.mockResolvedValue([
        {
          startTime: '09:00',
          endTime: '10:00',
          attendeesCount: 1,
        },
      ]);

      const result = await service.checkAvailability(
        mockResidentUser,
        mockFacility.id,
        '2026-10-15',
      );

      expect(result.facility.name).toBe(mockFacility.name);
      expect(result.slots.length).toBeGreaterThan(0);

      const nineSlot = result.slots.find((s) => s.startTime === '09:00');
      expect(nineSlot?.isAvailable).toBe(false);

      const tenSlot = result.slots.find((s) => s.startTime === '10:00');
      expect(tenSlot?.isAvailable).toBe(true);
    });
  });

  describe('createBooking', () => {
    it('should create booking and set PENDING_APPROVAL when approval required', async () => {
      const result = await service.createBooking(mockResidentUser, {
        facilityId: mockFacility.id,
        bookingDate: '2026-09-25',
        startTime: '18:00',
        endTime: '20:00',
        attendeesCount: 10,
        purpose: 'Party',
      });

      expect(result).toBeDefined();
      expect(result.status).toBe(BookingStatus.PENDING_APPROVAL);
      expect(notificationsService.send).toHaveBeenCalled();
    });

    it('should reject booking if hours are outside facility operating hours', async () => {
      dataSource.transaction.mockImplementation(async (cb: any) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockFacility),
        };
        return cb(mockManager);
      });

      await expect(
        service.createBooking(mockResidentUser, {
          facilityId: mockFacility.id,
          bookingDate: '2026-09-25',
          startTime: '05:00', // opens at 06:00
          endTime: '07:00',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject booking if advance booking limit exceeded', async () => {
      dataSource.transaction.mockImplementation(async (cb: any) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue({
            ...mockFacility,
            advanceBookingDaysLimit: 7,
          }),
        };
        return cb(mockManager);
      });

      await expect(
        service.createBooking(mockResidentUser, {
          facilityId: mockFacility.id,
          bookingDate: '2026-11-25', // months ahead
          startTime: '10:00',
          endTime: '12:00',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject booking if exclusive slot has conflicting active booking', async () => {
      dataSource.transaction.mockImplementation(async (cb: any) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockFacility),
          createQueryBuilder: jest.fn(() => ({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getCount: jest.fn().mockResolvedValue(0),
            getMany: jest.fn().mockResolvedValue([mockBooking]), // conflict!
          })),
        };
        return cb(mockManager);
      });

      await expect(
        service.createBooking(mockResidentUser, {
          facilityId: mockFacility.id,
          bookingDate: '2026-09-25',
          startTime: '18:00',
          endTime: '19:00',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('actionBooking', () => {
    it('should approve booking and record history', async () => {
      dataSource.transaction.mockImplementation(async (cb: any) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue({ ...mockBooking, status: BookingStatus.PENDING_APPROVAL }),
          save: jest.fn().mockImplementation((cls, entity) => Promise.resolve(entity)),
          create: jest.fn().mockImplementation((cls, dto) => dto),
        };
        return cb(mockManager);
      });

      const result = await service.actionBooking(mockAdminUser, mockBooking.id, {
        status: BookingStatus.CONFIRMED,
      });

      expect(result.status).toBe(BookingStatus.CONFIRMED);
      expect(notificationsService.send).toHaveBeenCalled();
    });

    it('should enforce rejectionReason when rejecting booking', async () => {
      await expect(
        service.actionBooking(mockAdminUser, mockBooking.id, {
          status: BookingStatus.REJECTED,
          rejectionReason: '',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelBooking', () => {
    it('should cancel booking and log history', async () => {
      dataSource.transaction.mockImplementation(async (cb: any) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue({
            ...mockBooking,
            status: BookingStatus.CONFIRMED,
            facility: { cancellationHoursBefore: 0 },
          }),
          save: jest.fn().mockImplementation((cls, entity) => Promise.resolve(entity)),
          create: jest.fn().mockImplementation((cls, dto) => dto),
        };
        return cb(mockManager);
      });

      const result = await service.cancelBooking(mockResidentUser, mockBooking.id, {
        reason: 'Event cancelled',
      });

      expect(result.status).toBe(BookingStatus.CANCELLED);
    });
  });

  describe('getBookingAnalytics', () => {
    it('should exclude cancelled and rejected bookings from revenue', async () => {
      bookingRepo.find.mockResolvedValue([
        { ...mockBooking, status: BookingStatus.CONFIRMED, totalFee: 2000, depositFee: 1000 },
        { ...mockBooking, id: 'b2', status: BookingStatus.CANCELLED, totalFee: 2000, depositFee: 1000 },
        { ...mockBooking, id: 'b3', status: BookingStatus.REJECTED, totalFee: 2000, depositFee: 1000 },
      ]);

      const analytics = await service.getBookingAnalytics(mockAdminUser);

      expect(analytics.summary.totalBookings).toBe(3);
      expect(analytics.summary.confirmedBookings).toBe(1);
      expect(analytics.summary.cancelledBookings).toBe(1);
      expect(analytics.summary.rejectedBookings).toBe(1);
      expect(analytics.summary.totalRevenue).toBe(2000); // cancelled & rejected excluded!
    });
  });
});
