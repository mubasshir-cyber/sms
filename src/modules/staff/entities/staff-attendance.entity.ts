import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { AttendanceStatus } from '../../../common/enums/staff.enum';

@Entity('staff_attendance')
@Index(['societyId', 'date'])
@Index(['staffId', 'date'])
export class StaffAttendance extends BaseEntity {
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Column({ name: 'staff_id', type: 'uuid' })
  staffId: string;

  /** Date of attendance (no time component) */
  @Column({ name: 'date', type: 'date' })
  date: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.PRESENT,
  })
  status: AttendanceStatus;

  @Column({ name: 'checkin_time', type: 'time', nullable: true })
  checkinTime: string | null;

  @Column({ name: 'checkout_time', type: 'time', nullable: true })
  checkoutTime: string | null;

  /** Gate where guard marked attendance (optional) */
  @Column({ name: 'gate_id', type: 'uuid', nullable: true })
  gateId: string | null;

  @Column({ name: 'marked_by_user_id', type: 'uuid' })
  markedByUserId: string;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string | null;
}
