jest.mock('@nestjs/bullmq', () => ({
  InjectQueue: () => () => {},
  Processor: () => () => {},
  WorkerHost: class {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { FacilitiesController } from './facilities.controller';
import { FacilitiesService } from './facilities.service';
import {
  FacilityType,
  CapacityType,
  BookingStatus,
} from '../../common/enums/facility-booking.enum';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

describe('FacilitiesController', () => {
  let controller: FacilitiesController;
  let service: any;

  const mockSocietyId = '11111111-1111-1111-1111-111111111111';
  const mockAdminUser: AuthUser = {
    sub: '22222222-2222-2222-2222-222222222222',
    email: 'admin@example.com',
    role: Role.SOCIETY_ADMIN,
    societyId: mockSocietyId,
  };

  const mockFacility = {
    id: 'fac-1',
    name: 'Tennis Court',
    facilityType: FacilityType.TENNIS_COURT,
    capacityType: CapacityType.EXCLUSIVE,
    capacity: 4,
  };

  const mockBooking = {
    id: 'book-1',
    facilityId: 'fac-1',
    bookingDate: '2026-09-25',
    startTime: '18:00',
    endTime: '19:00',
    status: BookingStatus.CONFIRMED,
  };

  beforeEach(async () => {
    service = {
      createFacility: jest.fn().mockResolvedValue(mockFacility),
      findFacilities: jest.fn().mockResolvedValue({ data: [mockFacility], total: 1, page: 1, limit: 20 }),
      findFacilityById: jest.fn().mockResolvedValue(mockFacility),
      updateFacility: jest.fn().mockResolvedValue(mockFacility),
      deleteFacility: jest.fn().mockResolvedValue({ success: true }),
      checkAvailability: jest.fn().mockResolvedValue({ facility: mockFacility, date: '2026-09-25', slots: [] }),
      createBooking: jest.fn().mockResolvedValue(mockBooking),
      findBookings: jest.fn().mockResolvedValue({ data: [mockBooking], total: 1, page: 1, limit: 20 }),
      findBookingById: jest.fn().mockResolvedValue(mockBooking),
      getBookingHistory: jest.fn().mockResolvedValue([]),
      actionBooking: jest.fn().mockResolvedValue({ ...mockBooking, status: BookingStatus.CONFIRMED }),
      cancelBooking: jest.fn().mockResolvedValue({ ...mockBooking, status: BookingStatus.CANCELLED }),
      getBookingAnalytics: jest.fn().mockResolvedValue({
        summary: { totalBookings: 1, totalRevenue: 500 },
        byFacility: [],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FacilitiesController],
      providers: [{ provide: FacilitiesService, useValue: service }],
    }).compile();

    controller = module.get<FacilitiesController>(FacilitiesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a facility', async () => {
    const dto = {
      name: 'Tennis Court',
      facilityType: FacilityType.TENNIS_COURT,
      capacity: 4,
    };
    const result = await controller.createFacility(mockAdminUser, dto as any);
    expect(result).toEqual(mockFacility);
    expect(service.createFacility).toHaveBeenCalledWith(mockAdminUser, dto);
  });

  it('should list facilities', async () => {
    const result = await controller.findFacilities(mockAdminUser, {});
    expect(result.data).toEqual([mockFacility]);
    expect(service.findFacilities).toHaveBeenCalledWith(mockAdminUser, {});
  });

  it('should check availability', async () => {
    const result = await controller.checkAvailability(mockAdminUser, 'fac-1', { date: '2026-09-25' });
    expect(result.date).toBe('2026-09-25');
    expect(service.checkAvailability).toHaveBeenCalledWith(mockAdminUser, 'fac-1', '2026-09-25');
  });

  it('should create a booking', async () => {
    const dto = {
      facilityId: 'fac-1',
      bookingDate: '2026-09-25',
      startTime: '18:00',
      endTime: '19:00',
    };
    const result = await controller.createBooking(mockAdminUser, dto as any);
    expect(result).toEqual(mockBooking);
    expect(service.createBooking).toHaveBeenCalledWith(mockAdminUser, dto);
  });

  it('should action a booking', async () => {
    const dto = { status: BookingStatus.CONFIRMED };
    const result = await controller.actionBooking(mockAdminUser, 'book-1', dto);
    expect(result.status).toBe(BookingStatus.CONFIRMED);
    expect(service.actionBooking).toHaveBeenCalledWith(mockAdminUser, 'book-1', dto);
  });

  it('should cancel a booking', async () => {
    const dto = { reason: 'No longer needed' };
    const result = await controller.cancelBooking(mockAdminUser, 'book-1', dto);
    expect(result.status).toBe(BookingStatus.CANCELLED);
    expect(service.cancelBooking).toHaveBeenCalledWith(mockAdminUser, 'book-1', dto);
  });

  it('should return booking analytics', async () => {
    const result = await controller.getBookingAnalytics(mockAdminUser);
    expect(result.summary.totalRevenue).toBe(500);
    expect(service.getBookingAnalytics).toHaveBeenCalledWith(mockAdminUser);
  });
});
