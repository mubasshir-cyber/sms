import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { InvoiceStatus } from '../../../common/enums/billing.enum';

export interface InvoiceLineItem {
  headId: string;
  headName: string;
  amount: number;
}

@Entity('invoices')
export class Invoice extends BaseEntity {
  @Index('IDX_invoice_society_id')
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Index('IDX_invoice_unit_id')
  @Column({ name: 'unit_id', type: 'uuid' })
  unitId: string;

  @Column({ name: 'resident_id', type: 'uuid', nullable: true })
  residentId: string | null;

  @Index('IDX_invoice_number', { unique: true })
  @Column({ name: 'invoice_number', type: 'varchar', length: 50, unique: true })
  invoiceNumber: string;

  @Column({ name: 'billing_month', type: 'int' })
  billingMonth: number;

  @Column({ name: 'billing_year', type: 'int' })
  billingYear: number;

  @Column({ name: 'due_date', type: 'date' })
  dueDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ name: 'late_fee', type: 'decimal', precision: 10, scale: 2, default: 0 })
  lateFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.PENDING })
  status: InvoiceStatus;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  lineItems: InvoiceLineItem[];

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @Column({ name: 'pdf_url', type: 'varchar', nullable: true })
  pdfUrl: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
