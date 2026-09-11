import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Vendor } from './vendor.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Vendor Review Entity — Represents ratings and review feedback for a vendor.
 * Table: vendor_reviews
 */
@Entity('vendor_reviews')
@Index('IDX_vendor_reviews_society_vendor', ['societyId', 'vendorId'])
export class VendorReview extends BaseEntity {
  @Index('IDX_vendor_reviews_society_id')
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Column({ name: 'vendor_id', type: 'uuid' })
  vendorId: string;

  @ManyToOne(() => Vendor, (vendor) => vendor.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Column({ name: 'contract_id', type: 'uuid', nullable: true })
  contractId: string | null;

  @Column({ type: 'int' })
  rating: number; // 1 to 5

  @Column({ type: 'text', nullable: true })
  review: string | null;

  @Column({ name: 'reviewed_by_user_id', type: 'uuid' })
  reviewedByUserId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reviewed_by_user_id' })
  reviewedByUser: User;
}
