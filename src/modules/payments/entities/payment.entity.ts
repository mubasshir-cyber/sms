import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { PaymentMethod, PaymentStatus } from '../../../common/enums/payment.enum';

/**
 * Payment Entity — records every payment attempt (online or manual).
 * Table: payments
 */
@Entity('payments')
export class Payment extends BaseEntity {
  @Index('IDX_payment_society_id')
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Index('IDX_payment_invoice_id')
  @Column({ name: 'invoice_id', type: 'uuid' })
  invoiceId: string;

  @Column({ name: 'unit_id', type: 'uuid' })
  unitId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  // ─── Gateway fields (Razorpay) ────────────────────────────────────────────
  @Column({ name: 'gateway_order_id', type: 'varchar', nullable: true })
  gatewayOrderId: string | null;

  @Column({ name: 'gateway_payment_id', type: 'varchar', nullable: true })
  gatewayPaymentId: string | null;

  @Column({ name: 'gateway_signature', type: 'varchar', nullable: true })
  gatewaySignature: string | null;

  // ─── Manual payment fields ────────────────────────────────────────────────
  @Column({ name: 'cheque_no', type: 'varchar', nullable: true })
  chequeNo: string | null;

  @Column({ name: 'bank_name', type: 'varchar', nullable: true })
  bankName: string | null;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @Column({ name: 'receipt_number', type: 'varchar', nullable: true, unique: true })
  receiptNumber: string | null;

  @Column({ name: 'receipt_url', type: 'varchar', nullable: true })
  receiptUrl: string | null;

  @Column({ name: 'recorded_by_user_id', type: 'uuid', nullable: true })
  recordedByUserId: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
