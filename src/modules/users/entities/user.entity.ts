import {
  Entity,
  Column,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Role } from '../../../common/enums/role.enum';

/**
 * User Entity — represents all user accounts in the system.
 * Covers all 9 roles from SUPER_ADMIN down to VENDOR.
 *
 * Table: users
 */
@Entity('users')
export class User extends BaseEntity {
  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName: string;

  @Index('IDX_users_email')
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  phone: string | null;

  /**
   * Hashed password — never returned in API responses.
   * Use select: false to exclude from default queries.
   */
  @Column({ name: 'password_hash', type: 'varchar', select: false, nullable: true })
  passwordHash: string | null;

  @Index('IDX_users_role')
  @Column({ type: 'enum', enum: Role, default: Role.RESIDENT })
  role: Role;

  /**
   * Society this user belongs to.
   * null for SUPER_ADMIN (platform-wide access).
   */
  @Index('IDX_users_society_id')
  @Column({ name: 'society_id', type: 'uuid', nullable: true })
  societyId: string | null;

  /**
   * Unit this user is associated with.
   * Populated for RESIDENT and TENANT roles.
   */
  @Column({ name: 'unit_id', type: 'uuid', nullable: true })
  unitId: string | null;

  /**
   * Gate this guard is assigned to.
   * Populated for SECURITY_GUARD role.
   */
  @Column({ name: 'gate_id', type: 'uuid', nullable: true })
  gateId: string | null;

  /**
   * Vendor this user represents.
   * Populated for VENDOR role.
   */
  @Column({ name: 'vendor_id', type: 'uuid', nullable: true })
  vendorId: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'is_email_verified', type: 'boolean', default: false })
  isEmailVerified: boolean;

  @Column({ name: 'is_phone_verified', type: 'boolean', default: false })
  isPhoneVerified: boolean;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;

  @Column({ name: 'failed_login_attempts', type: 'int', default: 0 })
  failedLoginAttempts: number;

  @Column({ name: 'locked_until', type: 'timestamp', nullable: true })
  lockedUntil: Date | null;

  @Column({ name: 'avatar_url', type: 'varchar', nullable: true })
  avatarUrl: string | null;

  // ─── Computed Properties ─────────────────────────────────────────────────

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get isLocked(): boolean {
    if (!this.lockedUntil) return false;
    return new Date() < this.lockedUntil;
  }

  // ─── Hooks ───────────────────────────────────────────────────────────────

  /**
   * Hash password before saving.
   * Only triggers if passwordHash field was directly set (plain text scenario).
   * In practice, always hash in the service using hashPassword() helper.
   */
  @BeforeInsert()
  @BeforeUpdate()
  async normalizeEmail() {
    if (this.email) {
      this.email = this.email.toLowerCase().trim();
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  /**
   * Validate a plain-text password against the stored hash.
   * Used during login.
   */
  async validatePassword(plainPassword: string): Promise<boolean> {
    if (!this.passwordHash) return false;
    return bcrypt.compare(plainPassword, this.passwordHash);
  }
}
