import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FacilityBooking } from './facility-booking.entity';
import { User } from '../../users/entities/user.entity';

@Entity('facility_booking_status_history')
@Index(['bookingId'])
@Index(['societyId'])
export class FacilityBookingStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Column({ name: 'booking_id', type: 'uuid' })
  bookingId: string;

  @ManyToOne(() => FacilityBooking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking?: FacilityBooking;

  @Column({ name: 'old_status', type: 'varchar', length: 50, nullable: true })
  oldStatus: string | null;

  @Column({ name: 'new_status', type: 'varchar', length: 50 })
  newStatus: string;

  @Column({ name: 'changed_by_user_id', type: 'uuid' })
  changedByUserId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'changed_by_user_id' })
  changedByUser?: User | null;

  @Column({ name: 'reason', type: 'text', nullable: true })
  reason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
