import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, In, IsNull } from 'typeorm';
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

import { UnitStatus } from '../../common/enums/unit-type.enum';
import { InvoiceStatus } from '../../common/enums/billing.enum';
import { PaymentStatus } from '../../common/enums/payment.enum';
import { ComplaintStatus } from '../../common/enums/complaint.enum';
import { DeliveryStatus } from '../../common/enums/delivery.enum';
import { AttendanceStatus } from '../../common/enums/staff.enum';
import { ParkingSlotStatus } from '../../common/enums/vehicle-parking.enum';
import { BookingStatus } from '../../common/enums/facility-booking.enum';

export interface DashboardSummary {
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  occupancyRate: string;
  currentMonth: {
    invoicesGenerated: number;
    totalBilled: number;
    totalCollected: number;
    collectionRate: string;
    outstanding: number;
  };
  totalExpenses: number;
  netBalance: number;
  operations?: DashboardOperationsSummary;
}

export interface DashboardOperationsSummary {
  complaints: {
    totalActive: number;
    open: number;
    inProgress: number;
    resolvedToday: number;
    escalated: number;
    slaBreached: number;
  };
  visitors: {
    checkedInToday: number;
    currentlyInside: number;
  };
  deliveries: {
    arrivedToday: number;
    pendingPickup: number;
    unattendedOverdue: number;
  };
  staff: {
    presentToday: number;
    onLeaveOrAbsentToday: number;
  };
  parking: {
    totalSlots: number;
    allocatedSlots: number;
    availableSlots: number;
    occupancyRate: string;
  };
  amenities: {
    bookingsToday: number;
    pendingApprovals: number;
    monthRevenue: number;
  };
}

export interface DashboardAlerts {
  overdueInvoices: number;
  vacantUnits: number;
  pendingExpensesToApprove: number;
  slaBreachedComplaints: number;
  unattendedDeliveries: number;
  pendingBookingApprovals: number;
  totalActionableAlerts: number;
}

export interface DashboardActivityItem {
  type: 'PAYMENT' | 'EXPENSE' | 'COMPLAINT' | 'DELIVERY' | 'BOOKING' | 'VISITOR';
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  status?: string;
  amount?: number;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Unit) private readonly unitsRepo: Repository<Unit>,
    @InjectRepository(Invoice) private readonly invoicesRepo: Repository<Invoice>,
    @InjectRepository(Payment) private readonly paymentsRepo: Repository<Payment>,
    @InjectRepository(Expense) private readonly expensesRepo: Repository<Expense>,
    @InjectRepository(Complaint) private readonly complaintsRepo: Repository<Complaint>,
    @InjectRepository(VisitorLog) private readonly visitorLogsRepo: Repository<VisitorLog>,
    @InjectRepository(Delivery) private readonly deliveriesRepo: Repository<Delivery>,
    @InjectRepository(StaffAttendance) private readonly staffAttendanceRepo: Repository<StaffAttendance>,
    @InjectRepository(ParkingSlot) private readonly parkingSlotsRepo: Repository<ParkingSlot>,
    @InjectRepository(FacilityBooking) private readonly bookingsRepo: Repository<FacilityBooking>,
  ) {}

  async getSummary(societyId: string): Promise<DashboardSummary> {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // 1. Unit statistics
    const totalUnits = await this.unitsRepo.count({ where: { societyId, isActive: true } });
    const occupiedUnits = await this.unitsRepo.count({
      where: { societyId, status: UnitStatus.OCCUPIED, isActive: true },
    });
    const vacantUnits = totalUnits - occupiedUnits;
    const occupancyRate = totalUnits > 0 ? `${((occupiedUnits / totalUnits) * 100).toFixed(1)}%` : '0.0%';

    // 2. Current Month Invoices
    const monthInvoices = await this.invoicesRepo.find({
      where: { societyId, billingMonth: currentMonth, billingYear: currentYear },
    });

    const invoicesGenerated = monthInvoices.length;
    const totalBilled = monthInvoices.reduce((acc, inv) => acc + Number(inv.totalAmount || 0), 0);

    const paidInvoices = monthInvoices.filter((inv) => inv.status === InvoiceStatus.PAID);
    const totalCollected = paidInvoices.reduce((acc, inv) => acc + Number(inv.totalAmount || 0), 0);
    const outstanding = totalBilled - totalCollected;
    const collectionRate =
      totalBilled > 0 ? `${((totalCollected / totalBilled) * 100).toFixed(1)}%` : '0.0%';

    // 3. Current Month Expenses
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    const monthExpenses = await this.expensesRepo.find({
      where: { societyId, expenseDate: Between(startOfMonth, endOfMonth) },
    });

    const totalExpenses = monthExpenses.reduce((acc, exp) => acc + Number(exp.amount || 0), 0);
    const netBalance = totalCollected - totalExpenses;

    // 4. Operations Overview
    const operations = await this.getOperationsSummary(societyId);

    return {
      totalUnits,
      occupiedUnits,
      vacantUnits,
      occupancyRate,
      currentMonth: {
        invoicesGenerated,
        totalBilled: Math.round(totalBilled * 100) / 100,
        totalCollected: Math.round(totalCollected * 100) / 100,
        collectionRate,
        outstanding: Math.round(outstanding * 100) / 100,
      },
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netBalance: Math.round(netBalance * 100) / 100,
      operations,
    };
  }

  async getOperationsSummary(societyId: string): Promise<DashboardOperationsSummary> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const todayStr = now.toISOString().slice(0, 10);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const startOfMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();
    const endOfMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;

    // 1. Complaints KPI
    const openComplaints = await this.complaintsRepo.count({
      where: { societyId, status: ComplaintStatus.OPEN },
    });
    const inProgressComplaints = await this.complaintsRepo.count({
      where: {
        societyId,
        status: In([ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS]),
      },
    });
    const escalatedComplaints = await this.complaintsRepo.count({
      where: { societyId, status: ComplaintStatus.ESCALATED },
    });
    const resolvedTodayComplaints = await this.complaintsRepo.count({
      where: {
        societyId,
        status: In([ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED]),
        resolvedAt: Between(startOfToday, endOfToday),
      },
    });
    const slaBreachedComplaints = await this.complaintsRepo.count({
      where: {
        societyId,
        status: In([
          ComplaintStatus.OPEN,
          ComplaintStatus.ASSIGNED,
          ComplaintStatus.IN_PROGRESS,
          ComplaintStatus.ESCALATED,
        ]),
        slaDeadline: LessThan(now),
      },
    });

    // 2. Visitors KPI
    const checkedInToday = await this.visitorLogsRepo.count({
      where: {
        societyId,
        checkedInAt: Between(startOfToday, endOfToday),
      },
    });
    const currentlyInside = await this.visitorLogsRepo.count({
      where: {
        societyId,
        checkedOutAt: IsNull(),
      },
    });

    // 3. Deliveries KPI
    const arrivedToday = await this.deliveriesRepo.count({
      where: {
        societyId,
        arrivedAt: Between(startOfToday, endOfToday),
      },
    });
    const pendingPickup = await this.deliveriesRepo.count({
      where: {
        societyId,
        status: DeliveryStatus.PENDING_PICKUP,
      },
    });
    const unattendedOverdue = await this.deliveriesRepo.count({
      where: {
        societyId,
        status: DeliveryStatus.PENDING_PICKUP,
        arrivedAt: LessThan(twentyFourHoursAgo),
      },
    });

    // 4. Staff Attendance KPI
    const presentToday = await this.staffAttendanceRepo.count({
      where: {
        societyId,
        date: todayStr,
        status: In([AttendanceStatus.PRESENT, AttendanceStatus.HALF_DAY]),
      },
    });
    const onLeaveOrAbsentToday = await this.staffAttendanceRepo.count({
      where: {
        societyId,
        date: todayStr,
        status: In([AttendanceStatus.ABSENT, AttendanceStatus.ON_LEAVE]),
      },
    });

    // 5. Parking Utilization
    const totalSlots = await this.parkingSlotsRepo.count({ where: { societyId } });
    const allocatedSlots = await this.parkingSlotsRepo.count({
      where: { societyId, status: ParkingSlotStatus.ALLOCATED },
    });
    const availableSlots = await this.parkingSlotsRepo.count({
      where: { societyId, status: ParkingSlotStatus.AVAILABLE },
    });
    const parkingOccupancyRate =
      totalSlots > 0 ? `${((allocatedSlots / totalSlots) * 100).toFixed(1)}%` : '0.0%';

    // 6. Amenities & Facilities
    const bookingsToday = await this.bookingsRepo.count({
      where: {
        societyId,
        bookingDate: todayStr,
        status: In([BookingStatus.CONFIRMED, BookingStatus.COMPLETED]),
      },
    });
    const pendingApprovals = await this.bookingsRepo.count({
      where: {
        societyId,
        status: BookingStatus.PENDING_APPROVAL,
      },
    });
    const monthBookings = await this.bookingsRepo.find({
      where: {
        societyId,
        bookingDate: Between(startOfMonthStr, endOfMonthStr),
        status: In([BookingStatus.CONFIRMED, BookingStatus.COMPLETED]),
      },
    });
    const monthRevenue = monthBookings.reduce(
      (acc, b) => acc + Number(b.totalFee || 0),
      0,
    );

    return {
      complaints: {
        totalActive: openComplaints + inProgressComplaints + escalatedComplaints,
        open: openComplaints,
        inProgress: inProgressComplaints,
        resolvedToday: resolvedTodayComplaints,
        escalated: escalatedComplaints,
        slaBreached: slaBreachedComplaints,
      },
      visitors: {
        checkedInToday,
        currentlyInside,
      },
      deliveries: {
        arrivedToday,
        pendingPickup,
        unattendedOverdue,
      },
      staff: {
        presentToday,
        onLeaveOrAbsentToday,
      },
      parking: {
        totalSlots,
        allocatedSlots,
        availableSlots,
        occupancyRate: parkingOccupancyRate,
      },
      amenities: {
        bookingsToday,
        pendingApprovals,
        monthRevenue: Math.round(monthRevenue * 100) / 100,
      },
    };
  }

  async getAlerts(societyId: string): Promise<DashboardAlerts> {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const overdueInvoices = await this.invoicesRepo.count({
      where: { societyId, status: InvoiceStatus.OVERDUE },
    });

    const vacantUnits = await this.unitsRepo.count({
      where: { societyId, status: UnitStatus.VACANT, isActive: true },
    });

    const pendingExpensesToApprove = await this.expensesRepo.count({
      where: { societyId, isApproved: false },
    });

    const slaBreachedComplaints = await this.complaintsRepo.count({
      where: {
        societyId,
        status: In([
          ComplaintStatus.OPEN,
          ComplaintStatus.ASSIGNED,
          ComplaintStatus.IN_PROGRESS,
          ComplaintStatus.ESCALATED,
        ]),
        slaDeadline: LessThan(now),
      },
    });

    const unattendedDeliveries = await this.deliveriesRepo.count({
      where: {
        societyId,
        status: DeliveryStatus.PENDING_PICKUP,
        arrivedAt: LessThan(twentyFourHoursAgo),
      },
    });

    const pendingBookingApprovals = await this.bookingsRepo.count({
      where: {
        societyId,
        status: BookingStatus.PENDING_APPROVAL,
      },
    });

    const totalActionableAlerts =
      overdueInvoices +
      pendingExpensesToApprove +
      slaBreachedComplaints +
      unattendedDeliveries +
      pendingBookingApprovals;

    return {
      overdueInvoices,
      vacantUnits,
      pendingExpensesToApprove,
      slaBreachedComplaints,
      unattendedDeliveries,
      pendingBookingApprovals,
      totalActionableAlerts,
    };
  }

  async getRecentActivity(societyId: string, limit = 15): Promise<DashboardActivityItem[]> {
    const payments = await this.paymentsRepo.find({
      where: { societyId, status: PaymentStatus.SUCCESS },
      order: { paidAt: 'DESC' },
      take: limit,
    });

    const expenses = await this.expensesRepo.find({
      where: { societyId },
      order: { expenseDate: 'DESC' },
      take: limit,
    });

    const complaints = await this.complaintsRepo.find({
      where: { societyId },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    const deliveries = await this.deliveriesRepo.find({
      where: { societyId },
      order: { arrivedAt: 'DESC' },
      take: limit,
    });

    const bookings = await this.bookingsRepo.find({
      where: { societyId },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    const visitorLogs = await this.visitorLogsRepo.find({
      where: { societyId },
      order: { checkedInAt: 'DESC' },
      take: limit,
    });

    const combined: DashboardActivityItem[] = [
      ...payments.map((p) => ({
        type: 'PAYMENT' as const,
        id: p.id,
        title: 'Payment Received',
        description: `Payment of ₹${p.amount} received via ${p.method.toUpperCase()}`,
        amount: Number(p.amount),
        status: p.status,
        timestamp: p.paidAt || p.createdAt,
      })),
      ...expenses.map((e) => ({
        type: 'EXPENSE' as const,
        id: e.id,
        title: e.vendorName ? `Expense (${e.vendorName})` : 'Expense Recorded',
        description: `${e.description || 'Expense'}: ₹${e.amount}`,
        amount: Number(e.amount),
        timestamp: e.expenseDate || e.createdAt,
      })),
      ...complaints.map((c) => ({
        type: 'COMPLAINT' as const,
        id: c.id,
        title: 'Helpdesk Ticket',
        description: `[${c.priority.toUpperCase()}] ${c.title} (${c.category})`,
        status: c.status,
        timestamp: c.createdAt,
      })),
      ...deliveries.map((d) => ({
        type: 'DELIVERY' as const,
        id: d.id,
        title: 'Parcel Delivery',
        description: `${d.deliveryType.toUpperCase()} package from ${d.company}`,
        status: d.status,
        timestamp: d.arrivedAt || d.createdAt,
      })),
      ...bookings.map((b) => ({
        type: 'BOOKING' as const,
        id: b.id,
        title: 'Amenity Booking',
        description: `Facility reserved for ${b.bookingDate} (${b.startTime} - ${b.endTime})`,
        status: b.status,
        amount: Number(b.totalFee),
        timestamp: b.createdAt,
      })),
      ...visitorLogs.map((v) => ({
        type: 'VISITOR' as const,
        id: v.id,
        title: 'Visitor Entry',
        description: v.vehicleNumber ? `Visitor checked in with vehicle ${v.vehicleNumber}` : 'Visitor checked in at gate',
        timestamp: v.checkedInAt || v.createdAt,
      })),
    ];

    combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return combined.slice(0, limit);
  }
}
