import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ParkingSlotType, ParkingSlotStatus } from '../../../common/enums/vehicle-parking.enum';
import { Tower } from '../../structure/entities/tower.entity';

@Entity('parking_slots')
@Index(['societyId', 'slotNumber'])
@Index(['societyId', 'status'])
@Index(['societyId', 'isVisitorSlot'])
export class ParkingSlot extends BaseEntity {
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Column({ name: 'tower_id', type: 'uuid', nullable: true })
  towerId: string | null;

  @ManyToOne(() => Tower, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'tower_id' })
  tower?: Tower | null;

  @Column({ name: 'slot_number', type: 'varchar', length: 50 })
  slotNumber: string;

  @Column({ name: 'floor', type: 'varchar', length: 50, nullable: true })
  floor: string | null;

  @Column({
    name: 'slot_type',
    type: 'enum',
    enum: ParkingSlotType,
    default: ParkingSlotType.OPEN,
  })
  slotType: ParkingSlotType;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ParkingSlotStatus,
    default: ParkingSlotStatus.AVAILABLE,
  })
  status: ParkingSlotStatus;

  @Column({ name: 'is_visitor_slot', type: 'boolean', default: false })
  isVisitorSlot: boolean;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string | null;
}
