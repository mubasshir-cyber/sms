import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { LeaveType, LeaveStatus } from '../../../common/enums/staff.enum';

@Entity('staff_leaves')
@Index(['societyId', 'staffId'])
@Index(['societyId', 'status'])
export class StaffLeave extends BaseEntity {
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Column({ name: 'staff_id', type: 'uuid' })
  staffId: string;

  @Column({
    name: 'leave_type',
    type: 'enum',
    enum: LeaveType,
    default: LeaveType.CASUAL,
  })
  leaveType: LeaveType;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @Column({ name: 'total_days', type: 'decimal', precision: 4, scale: 1 })
  totalDays: number;

  @Column({ name: 'reason', type: 'text' })
  reason: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: LeaveStatus,
    default: LeaveStatus.PENDING,
  })
  status: LeaveStatus;

  @Column({ name: 'applied_by_user_id', type: 'uuid' })
  appliedByUserId: string;

  @Column({ name: 'approved_by_user_id', type: 'uuid', nullable: true })
  approvedByUserId: string | null;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string | null;
}
