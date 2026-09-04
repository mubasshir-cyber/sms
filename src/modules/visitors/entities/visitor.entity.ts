import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { VisitorType, VisitorStatus } from '../../../common/enums/visitor.enum';

/**
 * Visitor Entity — pre-approved or registered visitor passes.
 * Table: visitors
 */
@Entity('visitors')
export class Visitor extends BaseEntity {
  @Index('IDX_visitor_society_id')
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Index('IDX_visitor_unit_id')
  @Column({ name: 'unit_id', type: 'uuid' })
  unitId: string;

  @Index('IDX_visitor_host_user_id')
  @Column({ name: 'host_user_id', type: 'uuid' })
  hostUserId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Index('IDX_visitor_phone')
  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({
    name: 'visitor_type',
    type: 'enum',
    enum: VisitorType,
    default: VisitorType.GUEST,
  })
  visitorType: VisitorType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  purpose: string | null;

  @Column({ name: 'vehicle_number', type: 'varchar', length: 30, nullable: true })
  vehicleNumber: string | null;

  @Column({ name: 'photo_url', type: 'varchar', nullable: true })
  photoUrl: string | null;

  @Index('IDX_visitor_passcode')
  @Column({ type: 'varchar', length: 10, nullable: true })
  passcode: string | null;

  @Index('IDX_visitor_qr_code')
  @Column({ name: 'qr_code_data', type: 'varchar', length: 100, nullable: true })
  qrCodeData: string | null;

  @Index('IDX_visitor_status')
  @Column({
    type: 'enum',
    enum: VisitorStatus,
    default: VisitorStatus.PRE_APPROVED,
  })
  status: VisitorStatus;

  @Column({ name: 'valid_from', type: 'timestamp' })
  validFrom: Date;

  @Column({ name: 'valid_until', type: 'timestamp' })
  validUntil: Date;

  @Column({ name: 'is_frequent', type: 'boolean', default: false })
  isFrequent: boolean;

  @Column({ name: 'is_blacklisted', type: 'boolean', default: false })
  isBlacklisted: boolean;

  @Column({ name: 'blacklist_reason', type: 'text', nullable: true })
  blacklistReason: string | null;
}
