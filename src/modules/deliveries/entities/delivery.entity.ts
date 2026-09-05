import {
  Entity,
  Column,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { DeliveryType, DeliveryStatus } from '../../../common/enums/delivery.enum';

@Entity('deliveries')
@Index(['societyId', 'status'])
@Index(['unitId'])
@Index(['gateId'])
@Index(['arrivedAt'])
export class Delivery extends BaseEntity {
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Column({ name: 'unit_id', type: 'uuid' })
  unitId: string;

  @Column({ name: 'recipient_user_id', type: 'uuid', nullable: true })
  recipientUserId: string | null;

  @Column({ name: 'gate_id', type: 'uuid' })
  gateId: string;

  @Column({ name: 'logged_by_guard_id', type: 'uuid' })
  loggedByGuardId: string;

  @Column({
    name: 'delivery_type',
    type: 'enum',
    enum: DeliveryType,
    default: DeliveryType.COURIER,
  })
  deliveryType: DeliveryType;

  @Column({ name: 'company', type: 'varchar', length: 100 })
  company: string;

  @Column({ name: 'delivery_person_name', type: 'varchar', length: 100, nullable: true })
  deliveryPersonName: string | null;

  @Column({ name: 'delivery_person_phone', type: 'varchar', length: 20, nullable: true })
  deliveryPersonPhone: string | null;

  @Column({ name: 'vehicle_number', type: 'varchar', length: 20, nullable: true })
  vehicleNumber: string | null;

  @Column({ name: 'tracking_number', type: 'varchar', length: 100, nullable: true })
  trackingNumber: string | null;

  @Column({ name: 'item_description', type: 'text', nullable: true })
  itemDescription: string | null;

  @Column({ name: 'photo_url', type: 'varchar', length: 500, nullable: true })
  photoUrl: string | null;

  @Column({
    name: 'status',
    type: 'enum',
    enum: DeliveryStatus,
    default: DeliveryStatus.PENDING_PICKUP,
  })
  status: DeliveryStatus;

  @Column({ name: 'pickup_otp', type: 'varchar', length: 10, nullable: true })
  pickupOtp: string | null;

  @Column({ name: 'passcode', type: 'varchar', length: 20, nullable: true })
  passcode: string | null;

  @Column({ name: 'leave_at_gate', type: 'boolean', default: true })
  leaveAtGate: boolean;

  @Column({ name: 'arrived_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  arrivedAt: Date;

  @Column({ name: 'collected_at', type: 'timestamp', nullable: true })
  collectedAt: Date | null;

  @Column({ name: 'collected_by_user_id', type: 'uuid', nullable: true })
  collectedByUserId: string | null;

  @Column({ name: 'collected_by_guard_id', type: 'uuid', nullable: true })
  collectedByGuardId: string | null;

  @Column({ name: 'handover_photo_url', type: 'varchar', length: 500, nullable: true })
  handoverPhotoUrl: string | null;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'is_unattended_alert_sent', type: 'boolean', default: false })
  isUnattendedAlertSent: boolean;

  @Column({ name: 'unattended_alert_sent_at', type: 'timestamp', nullable: true })
  unattendedAlertSentAt: Date | null;
}
