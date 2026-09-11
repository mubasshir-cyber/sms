import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { AllocationType } from '../../../common/enums/vehicle-parking.enum';
import { Unit } from '../../structure/entities/unit.entity';
import { ParkingSlot } from './parking-slot.entity';
import { Vehicle } from './vehicle.entity';

@Entity('parking_allocations')
@Index(['societyId', 'slotId'])
@Index(['societyId', 'unitId'])
@Index(['isActive'])
export class ParkingAllocation extends BaseEntity {
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Column({ name: 'slot_id', type: 'uuid' })
  slotId: string;

  @ManyToOne(() => ParkingSlot, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'slot_id' })
  slot?: ParkingSlot;

  @Column({ name: 'unit_id', type: 'uuid' })
  unitId: string;

  @ManyToOne(() => Unit, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'unit_id' })
  unit?: Unit;

  @Column({ name: 'resident_id', type: 'uuid', nullable: true })
  residentId: string | null;

  @Column({ name: 'vehicle_id', type: 'uuid', nullable: true })
  vehicleId: string | null;

  @ManyToOne(() => Vehicle, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle?: Vehicle | null;

  @Column({
    name: 'allocation_type',
    type: 'enum',
    enum: AllocationType,
    default: AllocationType.PRIMARY,
  })
  allocationType: AllocationType;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date | null;

  @Column({ name: 'monthly_fee', type: 'decimal', precision: 10, scale: 2, default: '0.00' })
  monthlyFee: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string | null;
}
