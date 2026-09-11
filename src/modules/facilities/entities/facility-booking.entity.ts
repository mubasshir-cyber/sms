import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { BookingStatus } from '../../../common/enums/facility-booking.enum';
import { Facility } from './facility.entity';
import { Unit } from '../../structure/entities/unit.entity';
import { User } from '../../users/entities/user.entity';

@Entity('facility_bookings')
@Index(['facilityId', 'bookingDate', 'status'])
@Index(['societyId', 'status'])
@Index(['unitId'])
@Index(['userId'])
export class FacilityBooking extends BaseEntity {
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Column({ name: 'facility_id', type: 'uuid' })
  facilityId: string;

  @ManyToOne(() => Facility, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'facility_id' })
  facility?: Facility;

  @Column({ name: 'unit_id', type: 'uuid' })
  unitId: string;

  @ManyToOne(() => Unit, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'unit_id' })
  unit?: Unit;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ name: 'booking_date', type: 'date' })
  bookingDate: string; // YYYY-MM-DD

  @Column({ name: 'start_time', type: 'varchar', length: 10 })
  startTime: string; // HH:mm

  @Column({ name: 'end_time', type: 'varchar', length: 10 })
  endTime: string; // HH:mm

  @Column({ name: 'attendees_count', type: 'int', default: 1 })
  attendeesCount: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING_APPROVAL,
  })
  status: BookingStatus;

  @Column({ name: 'total_fee', type: 'decimal', precision: 10, scale: 2, default: '0.00' })
  totalFee: number;

  @Column({ name: 'deposit_fee', type: 'decimal', precision: 10, scale: 2, default: '0.00' })
  depositFee: number;

  @Column({ name: 'purpose', type: 'text', nullable: true })
  purpose: string | null;

  @Column({ name: 'approved_by_user_id', type: 'uuid', nullable: true })
  approvedByUserId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'approved_by_user_id' })
  approvedByUser?: User | null;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string | null;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string | null;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt: Date | null;
}
