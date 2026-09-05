import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ShiftType } from '../../../common/enums/staff.enum';

@Entity('staff_shifts')
@Index(['societyId', 'staffId'])
export class StaffShift extends BaseEntity {
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Column({ name: 'staff_id', type: 'uuid' })
  staffId: string;

  @Column({
    name: 'shift_type',
    type: 'enum',
    enum: ShiftType,
    default: ShiftType.MORNING,
  })
  shiftType: ShiftType;

  /** HH:mm format, e.g. "06:00" */
  @Column({ name: 'start_time', type: 'varchar', length: 5 })
  startTime: string;

  /** HH:mm format, e.g. "14:00" */
  @Column({ name: 'end_time', type: 'varchar', length: 5 })
  endTime: string;

  @Column({ name: 'effective_from', type: 'date', nullable: true })
  effectiveFrom: string | null;

  @Column({ name: 'effective_to', type: 'date', nullable: true })
  effectiveTo: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'notes', type: 'varchar', length: 500, nullable: true })
  notes: string | null;
}
