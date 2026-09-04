import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { GateType } from '../../../common/enums/visitor.enum';

/**
 * Gate Entity — physical gate / barrier in a housing society.
 * Table: gates
 */
@Entity('gates')
export class Gate extends BaseEntity {
  @Index('IDX_gate_society_id')
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({
    name: 'gate_type',
    type: 'enum',
    enum: GateType,
    default: GateType.ENTRY_EXIT,
  })
  gateType: GateType;

  @Column({ name: 'location_description', type: 'text', nullable: true })
  locationDescription: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
