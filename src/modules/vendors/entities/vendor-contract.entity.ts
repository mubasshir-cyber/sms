import { Entity, Column, Index, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import {
  VendorCategory,
  ContractStatus,
  ContractBillingFrequency,
} from '../../../common/enums/vendor.enum';
import { Vendor } from './vendor.entity';
import { VendorAmcSchedule } from './vendor-amc-schedule.entity';
import { VendorInvoice } from './vendor-invoice.entity';

/**
 * Vendor Contract Entity — Represents a formal contract or AMC agreement with a vendor.
 * Table: vendor_contracts
 */
@Entity('vendor_contracts')
@Index('IDX_vendor_contracts_society_vendor', ['societyId', 'vendorId'])
@Index('IDX_vendor_contracts_status', ['societyId', 'status'])
@Index('IDX_vendor_contracts_dates', ['societyId', 'startDate', 'endDate'])
export class VendorContract extends BaseEntity {
  @Index('IDX_vendor_contracts_society_id')
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Column({ name: 'vendor_id', type: 'uuid' })
  vendorId: string;

  @ManyToOne(() => Vendor, (vendor) => vendor.contracts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Index('IDX_vendor_contracts_number', { unique: false })
  @Column({ name: 'contract_number', type: 'varchar', length: 50 })
  contractNumber: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ name: 'service_category', type: 'enum', enum: VendorCategory })
  serviceCategory: VendorCategory;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({ name: 'contract_value', type: 'decimal', precision: 10, scale: 2 })
  contractValue: number;

  @Column({
    name: 'billing_frequency',
    type: 'enum',
    enum: ContractBillingFrequency,
    default: ContractBillingFrequency.MONTHLY,
  })
  billingFrequency: ContractBillingFrequency;

  @Column({ name: 'payment_terms_days', type: 'int', default: 30 })
  paymentTermsDays: number;

  @Column({ name: 'terms_and_conditions', type: 'text', nullable: true })
  termsAndConditions: string | null;

  @Column({ name: 'sla_details', type: 'text', nullable: true })
  slaDetails: string | null;

  @Column({ name: 'document_urls', type: 'jsonb', nullable: true })
  documentUrls: string[] | null;

  @Column({ type: 'enum', enum: ContractStatus, default: ContractStatus.ACTIVE })
  status: ContractStatus;

  /**
   * Alert reminder intervals in days prior to contract expiry (default [30, 15, 7]).
   */
  @Column({ name: 'renewal_reminder_days', type: 'jsonb', default: [30, 15, 7] })
  renewalReminderDays: number[];

  @Column({ name: 'last_expiry_alert_sent_at', type: 'timestamp', nullable: true })
  lastExpiryAlertSentAt: Date | null;

  @OneToMany(() => VendorAmcSchedule, (schedule) => schedule.contract)
  amcSchedules: VendorAmcSchedule[];

  @OneToMany(() => VendorInvoice, (invoice) => invoice.contract)
  invoices: VendorInvoice[];
}
