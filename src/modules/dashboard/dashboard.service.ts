import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual } from 'typeorm';
import { Unit } from '../structure/entities/unit.entity';
import { Invoice } from '../maintenance/entities/invoice.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { UnitStatus } from '../../common/enums/unit-type.enum';
import { InvoiceStatus } from '../../common/enums/billing.enum';
import { PaymentStatus } from '../../common/enums/payment.enum';

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
}

export interface DashboardAlerts {
  overdueInvoices: number;
  vacantUnits: number;
  pendingExpensesToApprove: number;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Unit) private readonly unitsRepo: Repository<Unit>,
    @InjectRepository(Invoice) private readonly invoicesRepo: Repository<Invoice>,
    @InjectRepository(Payment) private readonly paymentsRepo: Repository<Payment>,
    @InjectRepository(Expense) private readonly expensesRepo: Repository<Expense>,
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
    };
  }

  async getAlerts(societyId: string): Promise<DashboardAlerts> {
    const overdueInvoices = await this.invoicesRepo.count({
      where: { societyId, status: InvoiceStatus.OVERDUE },
    });

    const vacantUnits = await this.unitsRepo.count({
      where: { societyId, status: UnitStatus.VACANT, isActive: true },
    });

    const pendingExpensesToApprove = await this.expensesRepo.count({
      where: { societyId, isApproved: false },
    });

    return {
      overdueInvoices,
      vacantUnits,
      pendingExpensesToApprove,
    };
  }

  async getRecentActivity(societyId: string, limit = 15): Promise<object[]> {
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

    const combined = [
      ...payments.map((p) => ({
        type: 'PAYMENT',
        id: p.id,
        amount: Number(p.amount),
        description: `Payment received via ${p.method.toUpperCase()}`,
        timestamp: p.paidAt || p.createdAt,
      })),
      ...expenses.map((e) => ({
        type: 'EXPENSE',
        id: e.id,
        amount: Number(e.amount),
        description: e.description,
        timestamp: e.expenseDate || e.createdAt,
      })),
    ];

    combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return combined.slice(0, limit);
  }
}
