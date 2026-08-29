import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * FamilyMember Entity — family members of a resident.
 * Table: family_members
 */
@Entity('family_members')
export class FamilyMember extends BaseEntity {
  @Index('IDX_family_resident_id')
  @Column({ name: 'resident_id', type: 'uuid' })
  residentId: string;

  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  relationship: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: Date | null;

  @Column({ name: 'is_emergency_contact', type: 'boolean', default: false })
  isEmergencyContact: boolean;
}
