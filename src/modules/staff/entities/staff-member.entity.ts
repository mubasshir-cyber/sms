import { Entity, Column, Index, BeforeInsert } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { StaffType, ShiftType, StaffStatus } from '../../../common/enums/staff.enum';

@Entity('staff_members')
@Index(['societyId', 'status'])
@Index(['societyId', 'staffType'])
export class StaffMember extends BaseEntity {
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  /**
   * Auto-generated unique code: STF-YYYY-NNN
   * Assigned in BeforeInsert hook.
   */
  @Column({ name: 'staff_code', type: 'varchar', length: 20, nullable: true })
  staffCode: string | null;

  @Column({
    name: 'staff_type',
    type: 'enum',
    enum: StaffType,
    default: StaffType.OTHER,
  })
  staffType: StaffType;

  @Column({
    name: 'status',
    type: 'enum',
    enum: StaffStatus,
    default: StaffStatus.ACTIVE,
  })
  status: StaffStatus;

  @Column({ name: 'name', type: 'varchar', length: 150 })
  name: string;

  @Column({ name: 'phone', type: 'varchar', length: 20 })
  phone: string;

  @Column({ name: 'email', type: 'varchar', length: 150, nullable: true })
  email: string | null;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: Date | null;

  @Column({ name: 'address', type: 'text', nullable: true })
  address: string | null;

  @Column({ name: 'photo_url', type: 'varchar', length: 500, nullable: true })
  photoUrl: string | null;

  /**
   * Aadhaar number — stored AES-256 encrypted; never exposed in plain text via API.
   * Masked as XXXX-XXXX-1234 in responses for non-admin roles.
   */
  @Column({ name: 'aadhaar_number', type: 'varchar', length: 255, nullable: true })
  aadhaarNumber: string | null;

  @Column({ name: 'pan_number', type: 'varchar', length: 50, nullable: true })
  panNumber: string | null;

  @Column({ name: 'monthly_wage', type: 'decimal', precision: 10, scale: 2, nullable: true })
  monthlyWage: number | null;

  @Column({
    name: 'default_shift',
    type: 'enum',
    enum: ShiftType,
    default: ShiftType.MORNING,
  })
  defaultShift: ShiftType;

  @Column({ name: 'join_date', type: 'date', nullable: true })
  joinDate: Date | null;

  @Column({ name: 'exit_date', type: 'date', nullable: true })
  exitDate: Date | null;

  @Column({ name: 'exit_reason', type: 'text', nullable: true })
  exitReason: string | null;

  /** Flag to distinguish full-time employees from domestic helpers (maid, cook, driver) */
  @Column({ name: 'is_domestic_help', type: 'boolean', default: false })
  isDomesticHelp: boolean;

  /** Background document URLs */
  @Column({ name: 'police_verification_url', type: 'varchar', length: 500, nullable: true })
  policeVerificationUrl: string | null;

  @Column({ name: 'aadhaar_doc_url', type: 'varchar', length: 500, nullable: true })
  aadhaarDocUrl: string | null;

  @Column({ name: 'id_proof_doc_url', type: 'varchar', length: 500, nullable: true })
  idProofDocUrl: string | null;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string | null;
}
