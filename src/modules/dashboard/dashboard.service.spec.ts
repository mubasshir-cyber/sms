jest.mock('@nestjs/bullmq', () => ({
  InjectQueue: () => () => {},
  Processor: () => () => {},
  WorkerHost: class {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { Unit } from '../structure/entities/unit.entity';
import { Invoice } from '../maintenance/entities/invoice.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Complaint } from '../complaints/entities/complaint.entity';
import { VisitorLog } from '../visitors/entities/visitor-log.entity';
import { Delivery } from '../deliveries/entities/delivery.entity';
import { StaffAttendance } from '../staff/entities/staff-attendance.entity';
import { ParkingSlot } from '../vehicles/entities/parking-slot.entity';
import { FacilityBooking } from '../facilities/entities/facility-booking.entity';

describe('DashboardService', () => {
  let service: DashboardService;

  const mockUnitsRepo = {
    count: jest.fn(),
  };

  const mockInvoicesRepo = {
    find: jest.fn(),
    count: jest.fn(),
  };

  const mockPaymentsRepo = {
    find: jest.fn(),
  };

  const mockExpensesRepo = {
    find: jest.fn(),
    count: jest.fn(),
  };

  const mockComplaintsRepo = {
    count: jest.fn(),
    find: jest.fn(),
  };

  const mockVisitorLogsRepo = {
    count: jest.fn(),
    find: jest.fn(),
  };

  const mockDeliveriesRepo = {
    count: jest.fn(),
    find: jest.fn(),
  };

  const mockStaffAttendanceRepo = {
    count: jest.fn(),
  };

  const mockParkingSlotsRepo = {
    count: jest.fn(),
  };

  const mockBookingsRepo = {
    count: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getRepositoryToken(Unit), useValue: mockUnitsRepo },
        { provide: getRepositoryToken(Invoice), useValue: mockInvoicesRepo },
        { provide: getRepositoryToken(Payment), useValue: mockPaymentsRepo },
        { provide: getRepositoryToken(Expense), useValue: mockExpensesRepo },
        { provide: getRepositoryToken(Complaint), useValue: mockComplaintsRepo },
        { provide: getRepositoryToken(VisitorLog), useValue: mockVisitorLogsRepo },
        { provide: getRepositoryToken(Delivery), useValue: mockDeliveriesRepo },
        { provide: getRepositoryToken(StaffAttendance), useValue: mockStaffAttendanceRepo },
        { provide: getRepositoryToken(ParkingSlot), useValue: mockParkingSlotsRepo },
        { provide: getRepositoryToken(FacilityBooking), useValue: mockBookingsRepo },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  const societyId = 'soc-1111-2222-3333';

  describe('getOperationsSummary', () => {
    it('should aggregate metrics from complaints, visitors, deliveries, staff, parking, and amenities', async () => {
      // Complaints: open, in-progress, escalated, resolvedToday, slaBreached
      mockComplaintsRepo.count
        .mockResolvedValueOnce(5)  // open
        .mockResolvedValueOnce(3)  // inProgress
        .mockResolvedValueOnce(1)  // escalated
        .mockResolvedValueOnce(2)  // resolvedToday
        .mockResolvedValueOnce(1); // slaBreached

      // Visitors: checkedInToday, currentlyInside
      mockVisitorLogsRepo.count
        .mockResolvedValueOnce(14) // checkedInToday
        .mockResolvedValueOnce(4);  // currentlyInside

      // Deliveries: arrivedToday, pendingPickup, unattendedOverdue
      mockDeliveriesRepo.count
        .mockResolvedValueOnce(8)  // arrivedToday
        .mockResolvedValueOnce(3)  // pendingPickup
        .mockResolvedValueOnce(1); // unattendedOverdue

      // Staff: presentToday, onLeaveOrAbsentToday
      mockStaffAttendanceRepo.count
        .mockResolvedValueOnce(10) // presentToday
        .mockResolvedValueOnce(2);  // onLeaveOrAbsentToday

      // Parking: totalSlots, allocatedSlots, availableSlots
      mockParkingSlotsRepo.count
        .mockResolvedValueOnce(50) // totalSlots
        .mockResolvedValueOnce(40) // allocatedSlots
        .mockResolvedValueOnce(10); // availableSlots

      // Bookings: bookingsToday, pendingApprovals, monthBookings
      mockBookingsRepo.count
        .mockResolvedValueOnce(4)  // bookingsToday
        .mockResolvedValueOnce(2);  // pendingApprovals
      mockBookingsRepo.find.mockResolvedValueOnce([
        { totalFee: '500.00' },
        { totalFee: '750.00' },
      ]);

      const result = await service.getOperationsSummary(societyId);

      expect(result.complaints).toEqual({
        totalActive: 9,
        open: 5,
        inProgress: 3,
        resolvedToday: 2,
        escalated: 1,
        slaBreached: 1,
      });

      expect(result.visitors).toEqual({
        checkedInToday: 14,
        currentlyInside: 4,
      });

      expect(result.deliveries).toEqual({
        arrivedToday: 8,
        pendingPickup: 3,
        unattendedOverdue: 1,
      });

      expect(result.staff).toEqual({
        presentToday: 10,
        onLeaveOrAbsentToday: 2,
      });

      expect(result.parking).toEqual({
        totalSlots: 50,
        allocatedSlots: 40,
        availableSlots: 10,
        occupancyRate: '80.0%',
      });

      expect(result.amenities).toEqual({
        bookingsToday: 4,
        pendingApprovals: 2,
        monthRevenue: 1250,
      });
    });
  });

  describe('getSummary', () => {
    it('should aggregate financial, structure, and operational data', async () => {
      mockUnitsRepo.count
        .mockResolvedValueOnce(100) // totalUnits
        .mockResolvedValueOnce(85);  // occupiedUnits

      mockInvoicesRepo.find.mockResolvedValueOnce([
        { totalAmount: '5000.00', status: 'paid' },
        { totalAmount: '3000.00', status: 'pending' },
      ]);

      mockExpensesRepo.find.mockResolvedValueOnce([
        { amount: '2000.00' },
      ]);

      // Mock getOperationsSummary internal repo counts
      mockComplaintsRepo.count.mockResolvedValue(0);
      mockVisitorLogsRepo.count.mockResolvedValue(0);
      mockDeliveriesRepo.count.mockResolvedValue(0);
      mockStaffAttendanceRepo.count.mockResolvedValue(0);
      mockParkingSlotsRepo.count.mockResolvedValue(0);
      mockBookingsRepo.count.mockResolvedValue(0);
      mockBookingsRepo.find.mockResolvedValue([]);

      const result = await service.getSummary(societyId);

      expect(result.totalUnits).toBe(100);
      expect(result.occupiedUnits).toBe(85);
      expect(result.vacantUnits).toBe(15);
      expect(result.occupancyRate).toBe('85.0%');
      expect(result.currentMonth.invoicesGenerated).toBe(2);
      expect(result.currentMonth.totalBilled).toBe(8000);
      expect(result.currentMonth.totalCollected).toBe(5000);
      expect(result.currentMonth.outstanding).toBe(3000);
      expect(result.totalExpenses).toBe(2000);
      expect(result.netBalance).toBe(3000);
      expect(result.operations).toBeDefined();
    });
  });

  describe('getAlerts', () => {
    it('should calculate all alerts including Phase 2 SLA, parcels, and bookings', async () => {
      mockInvoicesRepo.count.mockResolvedValueOnce(3);       // overdueInvoices
      mockUnitsRepo.count.mockResolvedValueOnce(12);         // vacantUnits
      mockExpensesRepo.count.mockResolvedValueOnce(2);       // pendingExpensesToApprove
      mockComplaintsRepo.count.mockResolvedValueOnce(4);     // slaBreachedComplaints
      mockDeliveriesRepo.count.mockResolvedValueOnce(5);     // unattendedDeliveries
      mockBookingsRepo.count.mockResolvedValueOnce(1);       // pendingBookingApprovals

      const result = await service.getAlerts(societyId);

      expect(result.overdueInvoices).toBe(3);
      expect(result.vacantUnits).toBe(12);
      expect(result.pendingExpensesToApprove).toBe(2);
      expect(result.slaBreachedComplaints).toBe(4);
      expect(result.unattendedDeliveries).toBe(5);
      expect(result.pendingBookingApprovals).toBe(1);
      expect(result.totalActionableAlerts).toBe(3 + 2 + 4 + 5 + 1); // 15
    });
  });

  describe('getRecentActivity', () => {
    it('should merge and sort activities chronologically across multiple modules', async () => {
      const now = new Date();
      const t1 = new Date(now.getTime() - 1000);
      const t2 = new Date(now.getTime() - 2000);
      const t3 = new Date(now.getTime() - 3000);
      const t4 = new Date(now.getTime() - 4000);
      const t5 = new Date(now.getTime() - 5000);
      const t6 = new Date(now.getTime() - 6000);

      mockPaymentsRepo.find.mockResolvedValueOnce([
        { id: 'pay-1', amount: '1500', method: 'upi', status: 'success', paidAt: t2 },
      ]);
      mockExpensesRepo.find.mockResolvedValueOnce([
        { id: 'exp-1', description: 'Gardening tools', amount: '800', vendorName: 'Nursery', expenseDate: t6 },
      ]);
      mockComplaintsRepo.find.mockResolvedValueOnce([
        { id: 'comp-1', title: 'Water Leak', priority: 'high', category: 'plumbing', status: 'open', createdAt: t1 },
      ]);
      mockDeliveriesRepo.find.mockResolvedValueOnce([
        { id: 'del-1', company: 'Amazon', deliveryType: 'courier', status: 'pending_pickup', arrivedAt: t3 },
      ]);
      mockBookingsRepo.find.mockResolvedValueOnce([
        { id: 'bk-1', bookingDate: '2026-09-12', startTime: '10:00', endTime: '12:00', totalFee: '300', status: 'confirmed', createdAt: t4 },
      ]);
      mockVisitorLogsRepo.find.mockResolvedValueOnce([
        { id: 'vis-1', vehicleNumber: 'KA01AB1234', checkedInAt: t5 },
      ]);

      const activities = await service.getRecentActivity(societyId, 10);

      expect(activities).toHaveLength(6);
      expect(activities[0].type).toBe('COMPLAINT');
      expect(activities[0].id).toBe('comp-1');
      expect(activities[1].type).toBe('PAYMENT');
      expect(activities[1].id).toBe('pay-1');
      expect(activities[2].type).toBe('DELIVERY');
      expect(activities[2].id).toBe('del-1');
      expect(activities[3].type).toBe('BOOKING');
      expect(activities[3].id).toBe('bk-1');
      expect(activities[4].type).toBe('VISITOR');
      expect(activities[4].id).toBe('vis-1');
      expect(activities[5].type).toBe('EXPENSE');
      expect(activities[5].id).toBe('exp-1');
    });
  });
});
