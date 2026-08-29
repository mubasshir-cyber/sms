import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Tower } from './tower.entity';

/**
 * Floor Entity — a floor within a tower.
 *
 * Table: floors
 */
@Entity('floors')
export class Floor extends BaseEntity {
  @Index('IDX_floors_society_id')
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Index('IDX_floors_tower_id')
  @Column({ name: 'tower_id', type: 'uuid' })
  towerId: string;

  @ManyToOne(() => Tower, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tower_id' })
  tower: Tower;

  /** 0 = Ground floor, negative = basement */
  @Column({ name: 'floor_number', type: 'int' })
  floorNumber: number;

  /** Display label e.g. "Ground", "1st", "Terrace", "B1" */
  @Column({ name: 'display_name', type: 'varchar', length: 50, nullable: true })
  displayName: string | null;
}
