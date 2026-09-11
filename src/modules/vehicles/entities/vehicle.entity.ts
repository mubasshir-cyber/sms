import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { VehicleType, VehicleVerificationStatus } from '../../../common/enums/vehicle-parking.enum';
import { Unit } from '../../structure/entities/unit.entity';
import { User } from '../../users/entities/user.entity';
import { ParkingSlot } from './parking-slot.entity';

@Entity('vehicles')
@Index(['societyId', 'registrationNumber'])
@Index(['societyId', 'rfidTag'])
@Index(['societyId', 'verificationStatus'])
@Index(['unitId'])
@Index(['userId'])
export class Vehicle extends BaseEntity {
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

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

  @Column({
    name: 'vehicle_type',
    type: 'enum',
    enum: VehicleType,
    default: VehicleType.CAR,
  })
  vehicleType: VehicleType;

  @Column({ name: 'registration_number', type: 'varchar', length: 50 })
  registrationNumber: string;

  @Column({ name: 'make_model', type: 'varchar', length: 150, nullable: true })
  makeModel: string | null;

  @Column({ name: 'color', type: 'varchar', length: 50, nullable: true })
  color: string | null;

  @Column({ name: 'rfid_tag', type: 'varchar', length: 100, nullable: true })
  rfidTag: string | null;

  @Column({ name: 'fastag_number', type: 'varchar', length: 100, nullable: true })
  fastagNumber: string | null;

  @Column({ name: 'rc_document_url', type: 'varchar', length: 500, nullable: true })
  rcDocumentUrl: string | null;

  @Column({ name: 'insurance_document_url', type: 'varchar', length: 500, nullable: true })
  insuranceDocumentUrl: string | null;

  @Column({ name: 'insurance_expiry_date', type: 'date', nullable: true })
  insuranceExpiryDate: Date | null;

  @Column({
    name: 'verification_status',
    type: 'enum',
    enum: VehicleVerificationStatus,
    default: VehicleVerificationStatus.PENDING,
  })
  verificationStatus: VehicleVerificationStatus;

  @Column({ name: 'verified_by_user_id', type: 'uuid', nullable: true })
  verifiedByUserId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'verified_by_user_id' })
  verifiedByUser?: User | null;

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt: Date | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'parking_slot_id', type: 'uuid', nullable: true })
  parkingSlotId: string | null;

  @ManyToOne(() => ParkingSlot, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'parking_slot_id' })
  parkingSlot?: ParkingSlot | null;
}
