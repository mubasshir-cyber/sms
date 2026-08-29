import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

/**
 * Address value object embedded in Society.
 * Stored as JSONB.
 */
export class SocietyAddress {
  street: string;
  locality?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

/**
 * Society Entity — represents a single housing society / apartment complex.
 *
 * A Society belongs to exactly one Tenant.
 * All other entities (Units, Residents, Invoices, etc.) reference societyId.
 *
 * Table: societies
 */
@Entity('societies')
export class Society extends BaseEntity {
  // ─── Tenant Relationship ─────────────────────────────────────────────────

  /**
   * The platform-level tenant this society belongs to.
   */
  @Index('IDX_societies_tenant_id')
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // ─── Identity ─────────────────────────────────────────────────────────────

  @Column({ type: 'varchar', length: 200 })
  name: string;

  /**
   * URL-safe slug unique within the platform.
   * e.g. "green-valley-phase-1"
   */
  @Index('IDX_societies_slug', { unique: true })
  @Column({ type: 'varchar', length: 150, unique: true })
  slug: string;

  // ─── Address ─────────────────────────────────────────────────────────────

  /**
   * Full address stored as JSONB.
   * { street, locality?, city, state, pincode, country }
   */
  @Column({ type: 'jsonb', nullable: true })
  address: SocietyAddress | null;

  // ─── Legal / Business Info ────────────────────────────────────────────────

  /**
   * Society registration number from local authority (e.g. Registrar of Societies).
   */
  @Column({ name: 'registration_no', type: 'varchar', length: 100, nullable: true })
  registrationNo: string | null;

  /**
   * GST identification number (for tax invoices).
   */
  @Column({ name: 'gst_no', type: 'varchar', length: 20, nullable: true })
  gstNo: string | null;

  // ─── Branding ────────────────────────────────────────────────────────────

  @Column({ name: 'logo_url', type: 'varchar', nullable: true })
  logoUrl: string | null;

  // ─── Operational Metadata ─────────────────────────────────────────────────

  /**
   * IANA timezone for billing cycles, invoice due dates, etc.
   * e.g. "Asia/Kolkata"
   */
  @Column({ type: 'varchar', length: 100, default: 'Asia/Kolkata' })
  timezone: string;

  /**
   * Contact email for the society office / admin.
   */
  @Column({ name: 'contact_email', type: 'varchar', length: 255, nullable: true })
  contactEmail: string | null;

  /**
   * Contact phone for the society office.
   */
  @Column({ name: 'contact_phone', type: 'varchar', length: 20, nullable: true })
  contactPhone: string | null;

  // ─── Structure Counts (denormalised for fast dashboard queries) ────────────

  /**
   * Total number of towers/wings in this society.
   * Updated whenever a Tower is added/removed.
   */
  @Column({ name: 'total_towers', type: 'int', default: 0 })
  totalTowers: number;

  /**
   * Total number of units in this society.
   * Updated whenever a Unit is added/removed.
   */
  @Column({ name: 'total_units', type: 'int', default: 0 })
  totalUnits: number;

  // ─── Status ──────────────────────────────────────────────────────────────

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  // ─── Flexible Settings ────────────────────────────────────────────────────

  /**
   * Society-level configuration overrides.
   * e.g. { "billingDay": 1, "lateFeeEnabled": true, "currency": "INR" }
   */
  @Column({ type: 'jsonb', nullable: true, default: () => "'{}'" })
  settings: Record<string, unknown>;
}
