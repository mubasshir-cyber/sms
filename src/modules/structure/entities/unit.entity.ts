import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Tower } from './tower.entity';
import { Floor } from './floor.entity';
import { UnitType, UnitStatus } from '../../../common/enums/unit-type.enum';

/**
 * Unit Entity — an individual flat/shop/office within the society.
 *
 * Table: units
 */
@Entity('units')
export class Unit extends BaseEntity {
  @Index('IDX_units_society_id')
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Index('IDX_units_tower_id')
  @Column({ name: 'tower_id', type: 'uuid' })
  towerId: string;

  @ManyToOne(() => Tower, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tower_id' })
  tower: Tower;

  @Index('IDX_units_floor_id')
  @Column({ name: 'floor_id', type: 'uuid' })
  floorId: string;

  @ManyToOne(() => Floor, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'floor_id' })
  floor: Floor;

  /** e.g. "101", "A-201", "GF-Shop-3" */
  @Column({ name: 'unit_number', type: 'varchar', length: 20 })
  unitNumber: string;

  @Column({ type: 'enum', enum: UnitType, default: UnitType.BHK_2 })
  type: UnitType;

  @Column({ name: 'sq_ft', type: 'decimal', precision: 8, scale: 2, nullable: true })
  sqFt: number | null;

  @Column({ type: 'int', nullable: true })
  bedrooms: number | null;

  @Column({ type: 'int', nullable: true })
  bathrooms: number | null;

  @Column({ type: 'enum', enum: UnitStatus, default: UnitStatus.VACANT })
  status: UnitStatus;

  /** Currently registered owner user (set when resident is added) */
  @Column({ name: 'owner_user_id', type: 'uuid', nullable: true })
  ownerUserId: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
