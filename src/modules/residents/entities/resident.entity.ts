import { Entity, Column, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ResidentType } from '../../../common/enums/resident-type.enum';

/**
 * Resident Entity — links a User to a Unit within a Society.
 * One user can be resident in one unit (unique per society).
 *
 * Table: residents
 */
@Entity('residents')
@Unique('UQ_residents_user_society', ['userId', 'societyId'])
export class Resident extends BaseEntity {
  @Index('IDX_residents_society_id')
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Index('IDX_residents_user_id')
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Index('IDX_residents_unit_id')
  @Column({ name: 'unit_id', type: 'uuid' })
  unitId: string;

  @Column({ type: 'enum', enum: ResidentType, default: ResidentType.OWNER })
  type: ResidentType;

  @Column({ name: 'move_in_date', type: 'date', nullable: true })
  moveInDate: Date | null;

  @Column({ name: 'move_out_date', type: 'date', nullable: true })
  moveOutDate: Date | null;

  @Column({ name: 'lease_start_date', type: 'date', nullable: true })
  leaseStartDate: Date | null;

  @Column({ name: 'lease_end_date', type: 'date', nullable: true })
  leaseEndDate: Date | null;

  @Column({ name: 'emergency_contact_name', type: 'varchar', length: 150, nullable: true })
  emergencyContactName: string | null;

  @Column({ name: 'emergency_contact_phone', type: 'varchar', length: 20, nullable: true })
  emergencyContactPhone: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
