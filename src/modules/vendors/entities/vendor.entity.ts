import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { VendorCategory, VendorStatus } from '../../../common/enums/vendor.enum';
import { VendorContract } from './vendor-contract.entity';
import { VendorInvoice } from './vendor-invoice.entity';
import { VendorReview } from './vendor-review.entity';

export interface VendorBankDetails {
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  upiId?: string;
}

/**
 * Vendor Entity — Represents a contracted third-party service provider or agency.
 * Table: vendors
 */
@Entity('vendors')
@Index('IDX_vendors_society_status', ['societyId', 'status'])
@Index('IDX_vendors_society_category', ['societyId', 'category'])
export class Vendor extends BaseEntity {
  @Index('IDX_vendors_society_id')
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'enum', enum: VendorCategory, default: VendorCategory.OTHER })
  category: VendorCategory;

  @Column({ name: 'contact_person', type: 'varchar', length: 150 })
  contactPerson: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ name: 'alternate_phone', type: 'varchar', length: 20, nullable: true })
  alternatePhone: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gstin: string | null;

  @Column({ type: 'varchar', length: 15, nullable: true })
  pan: string | null;

  @Column({ name: 'bank_details', type: 'jsonb', nullable: true })
  bankDetails: VendorBankDetails | null;

  @Column({ type: 'enum', enum: VendorStatus, default: VendorStatus.ACTIVE })
  status: VendorStatus;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.0 })
  rating: number;

  @Column({ name: 'rating_count', type: 'int', default: 0 })
  ratingCount: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  /**
   * Optional reference to a User account if the vendor is granted portal login.
   */
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @OneToMany(() => VendorContract, (contract) => contract.vendor)
  contracts: VendorContract[];

  @OneToMany(() => VendorInvoice, (invoice) => invoice.vendor)
  invoices: VendorInvoice[];

  @OneToMany(() => VendorReview, (review) => review.vendor)
  reviews: VendorReview[];
}
