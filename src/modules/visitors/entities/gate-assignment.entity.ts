import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * GateAssignment Entity — allocates security guards to shifts at specific gates.
 * Table: gate_assignments
 */
@Entity('gate_assignments')
export class GateAssignment extends BaseEntity {
  @Index('IDX_gate_assign_society_id')
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Index('IDX_gate_assign_gate_id')
  @Column({ name: 'gate_id', type: 'uuid' })
  gateId: string;

  @Index('IDX_gate_assign_guard_id')
  @Column({ name: 'guard_user_id', type: 'uuid' })
  guardUserId: string;

  @Column({ name: 'shift_name', type: 'varchar', length: 50, nullable: true })
  shiftName: string | null;

  @Column({ name: 'shift_start', type: 'timestamp' })
  shiftStart: Date;

  @Column({ name: 'shift_end', type: 'timestamp' })
  shiftEnd: Date;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
