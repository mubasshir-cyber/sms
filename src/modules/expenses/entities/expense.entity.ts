import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('expense_categories')
export class ExpenseCategory extends BaseEntity {
  @Index('IDX_expcat_society_id')
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}

@Entity('expenses')
export class Expense extends BaseEntity {
  @Index('IDX_expense_society_id')
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ name: 'expense_date', type: 'date' })
  expenseDate: Date;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'vendor_name', type: 'varchar', length: 150, nullable: true })
  vendorName: string | null;

  @Column({ name: 'invoice_no', type: 'varchar', length: 50, nullable: true })
  invoiceNo: string | null;

  @Column({ name: 'receipt_url', type: 'varchar', nullable: true })
  receiptUrl: string | null;

  @Column({ name: 'added_by_user_id', type: 'uuid' })
  addedByUserId: string;

  @Column({ name: 'approved_by_user_id', type: 'uuid', nullable: true })
  approvedByUserId: string | null;

  @Column({ name: 'is_approved', type: 'boolean', default: false })
  isApproved: boolean;
}

@Entity('bank_accounts')
export class BankAccount extends BaseEntity {
  @Index('IDX_bankacct_society_id')
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Column({ name: 'bank_name', type: 'varchar', length: 100 })
  bankName: string;

  @Column({ name: 'account_number', type: 'varchar', length: 30 })
  accountNumber: string;

  @Column({ name: 'ifsc_code', type: 'varchar', length: 20 })
  ifscCode: string;

  @Column({ name: 'account_type', type: 'varchar', length: 20, default: 'savings' })
  accountType: 'savings' | 'current';

  @Column({ name: 'opening_balance', type: 'decimal', precision: 12, scale: 2, default: 0 })
  openingBalance: number;

  @Column({ name: 'current_balance', type: 'decimal', precision: 12, scale: 2, default: 0 })
  currentBalance: number;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
