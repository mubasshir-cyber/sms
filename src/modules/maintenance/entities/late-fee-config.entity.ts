import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('late_fee_configs')
export class LateFeeConfig extends BaseEntity {
  @Index('IDX_lfc_society_id', { unique: true })
  @Column({ name: 'society_id', type: 'uuid', unique: true })
  societyId: string;

  @Column({ name: 'fee_type', type: 'varchar', length: 10 }) // 'flat' | 'percent'
  feeType: 'flat' | 'percent';

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value: number;

  @Column({ name: 'grace_period_days', type: 'int', default: 5 })
  gracePeriodDays: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
