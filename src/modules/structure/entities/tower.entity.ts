import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * Tower Entity — a wing/block within a society.
 * e.g. "Tower A", "Wing B", "Block C"
 *
 * Table: towers
 */
@Entity('towers')
export class Tower extends BaseEntity {
  @Index('IDX_towers_society_id')
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'total_floors', type: 'int', default: 0 })
  totalFloors: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
