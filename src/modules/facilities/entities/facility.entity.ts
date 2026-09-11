import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import {
  FacilityType,
  CapacityType,
  BookingSlotType,
} from '../../../common/enums/facility-booking.enum';

@Entity('facilities')
@Index(['societyId', 'isActive'])
@Index(['societyId', 'name'])
export class Facility extends BaseEntity {
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Column({ name: 'name', type: 'varchar', length: 150 })
  name: string;

  @Column({
    name: 'facility_type',
    type: 'enum',
    enum: FacilityType,
    default: FacilityType.OTHER,
  })
  facilityType: FacilityType;

  @Column({
    name: 'capacity_type',
    type: 'enum',
    enum: CapacityType,
    default: CapacityType.EXCLUSIVE,
  })
  capacityType: CapacityType;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'location', type: 'varchar', length: 150, nullable: true })
  location: string | null;

  @Column({ name: 'capacity', type: 'int', default: 1 })
  capacity: number;

  @Column({ name: 'rules', type: 'text', nullable: true })
  rules: string | null;

  @Column({
    name: 'image_urls',
    type: 'varchar',
    array: true,
    default: '{}',
    nullable: true,
  })
  imageUrls: string[] | null;

  @Column({
    name: 'booking_slot_type',
    type: 'enum',
    enum: BookingSlotType,
    default: BookingSlotType.HOURLY,
  })
  bookingSlotType: BookingSlotType;

  @Column({ name: 'slot_duration_minutes', type: 'int', default: 60 })
  slotDurationMinutes: number;

  @Column({ name: 'open_time', type: 'varchar', length: 10, default: '06:00' })
  openTime: string;

  @Column({ name: 'close_time', type: 'varchar', length: 10, default: '22:00' })
  closeTime: string;

  @Column({ name: 'booking_fee', type: 'decimal', precision: 10, scale: 2, default: '0.00' })
  bookingFee: number;

  @Column({ name: 'deposit_fee', type: 'decimal', precision: 10, scale: 2, default: '0.00' })
  depositFee: number;

  @Column({ name: 'requires_approval', type: 'boolean', default: false })
  requiresApproval: boolean;

  @Column({ name: 'max_bookings_per_month_per_unit', type: 'int', default: 4 })
  maxBookingsPerMonthPerUnit: number;

  @Column({ name: 'advance_booking_days_limit', type: 'int', default: 30 })
  advanceBookingDaysLimit: number;

  @Column({ name: 'cancellation_hours_before', type: 'int', default: 24 })
  cancellationHoursBefore: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
