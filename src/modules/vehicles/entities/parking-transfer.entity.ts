import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { TransferStatus } from '../../../common/enums/vehicle-parking.enum';
import { Unit } from '../../structure/entities/unit.entity';
import { User } from '../../users/entities/user.entity';
import { ParkingSlot } from './parking-slot.entity';

@Entity('parking_transfers')
@Index(['societyId', 'status'])
export class ParkingTransfer extends BaseEntity {
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Column({ name: 'slot_id', type: 'uuid' })
  slotId: string;

  @ManyToOne(() => ParkingSlot, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'slot_id' })
  slot?: ParkingSlot;

  @Column({ name: 'from_unit_id', type: 'uuid' })
  fromUnitId: string;

  @ManyToOne(() => Unit, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'from_unit_id' })
  fromUnit?: Unit;

  @Column({ name: 'to_unit_id', type: 'uuid' })
  toUnitId: string;

  @ManyToOne(() => Unit, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'to_unit_id' })
  toUnit?: Unit;

  @Column({ name: 'requested_by_user_id', type: 'uuid' })
  requestedByUserId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requested_by_user_id' })
  requestedByUser?: User;

  @Column({
    name: 'status',
    type: 'enum',
    enum: TransferStatus,
    default: TransferStatus.PENDING,
  })
  status: TransferStatus;

  @Column({ name: 'reason', type: 'text' })
  reason: string;

  @Column({ name: 'admin_notes', type: 'text', nullable: true })
  adminNotes: string | null;

  @Column({ name: 'approved_by_user_id', type: 'uuid', nullable: true })
  approvedByUserId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'approved_by_user_id' })
  approvedByUser?: User | null;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date | null;
}
