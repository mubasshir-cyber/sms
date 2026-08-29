import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('maintenance_heads')
export class MaintenanceHead extends BaseEntity {
  @Index('IDX_mhead_society_id')
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
