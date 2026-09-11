import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { VendorInvoiceStatus } from '../../../common/enums/vendor.enum';
import { Vendor } from './vendor.entity';
import { VendorContract } from './vendor-contract.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Vendor Invoice Entity — Represents billing receipts/invoices submitted by a vendor.
 * Table: vendor_invoices
 */
@Entity('vendor_invoices')
@Index('IDX_vendor_invoices_society_vendor', ['societyId', 'vendorId'])
@Index('IDX_vendor_invoices_payment_status', ['societyId', 'paymentStatus'])
@Index('IDX_vendor_invoices_due_date', ['societyId', 'dueDate'])
export class VendorInvoice extends BaseEntity {
  @Index('IDX_vendor_invoices_society_id')
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Column({ name: 'vendor_id', type: 'uuid' })
  vendorId: string;

  @ManyToOne(() => Vendor, (vendor) => vendor.invoices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Column({ name: 'contract_id', type: 'uuid', nullable: true })
  contractId: string | null;

  @ManyToOne(() => VendorContract, (contract) => contract.invoices, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'contract_id' })
  contract: VendorContract | null;

  @Column({ name: 'invoice_number', type: 'varchar', length: 100 })
  invoiceNumber: string;

  @Column({ name: 'invoice_date', type: 'date' })
  invoiceDate: Date;

  @Column({ name: 'due_date', type: 'date' })
  dueDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ name: 'tax_amount', type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  taxAmount: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: VendorInvoiceStatus,
    default: VendorInvoiceStatus.PENDING_APPROVAL,
  })
  paymentStatus: VendorInvoiceStatus;

  @Column({ name: 'paid_amount', type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  paidAmount: number;

  @Column({ name: 'payment_reference', type: 'varchar', length: 100, nullable: true })
  paymentReference: string | null;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date | null;

  /**
   * Optional link to society Expense record in Module 9.
   */
  @Column({ name: 'expense_id', type: 'uuid', nullable: true })
  expenseId: string | null;

  @Column({ name: 'invoice_pdf_url', type: 'varchar', length: 500, nullable: true })
  invoicePdfUrl: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'approved_by_user_id', type: 'uuid', nullable: true })
  approvedByUserId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'approved_by_user_id' })
  approvedByUser: User | null;
}
