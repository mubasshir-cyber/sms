import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Plan } from '../../../common/enums/plan.enum';

/**
 * Tenant Entity — represents a platform-level customer (a housing society operator).
 *
 * A Tenant is the top-level multi-tenant boundary.
 * Each Tenant can have one or more Societies.
 *
 * Managed exclusively by SUPER_ADMIN.
 *
 * Table: tenants
 */
@Entity('tenants')
export class Tenant extends BaseEntity {
  /**
   * Human-readable name of the tenant / organisation.
   * e.g. "Green Valley Society Group", "ABC Housing Pvt Ltd"
   */
  @Column({ type: 'varchar', length: 200 })
  name: string;

  /**
   * URL-safe unique identifier for the tenant.
   * Used in subdomains or API paths: e.g. "green-valley"
   */
  @Index('IDX_tenants_slug', { unique: true })
  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  // ─── Primary Contact ────────────────────────────────────────────────────────

  @Column({ name: 'contact_name', type: 'varchar', length: 150 })
  contactName: string;

  @Index('IDX_tenants_contact_email')
  @Column({ name: 'contact_email', type: 'varchar', length: 255, unique: true })
  contactEmail: string;

  @Column({ name: 'contact_phone', type: 'varchar', length: 20, nullable: true })
  contactPhone: string | null;

  // ─── Subscription ────────────────────────────────────────────────────────────

  @Column({ type: 'enum', enum: Plan, default: Plan.FREE })
  plan: Plan;

  /**
   * Maximum number of societies this tenant can create.
   * Defaults match plan limits; can be overridden by SUPER_ADMIN.
   */
  @Column({ name: 'max_societies', type: 'int', default: 1 })
  maxSocieties: number;

  /**
   * When the current plan expires. null = no expiry (lifetime / manual).
   */
  @Column({ name: 'plan_expires_at', type: 'timestamp', nullable: true })
  planExpiresAt: Date | null;

  // ─── Status ──────────────────────────────────────────────────────────────────

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  // ─── Flexible Settings ────────────────────────────────────────────────────────

  /**
   * JSONB bag for tenant-level configuration overrides.
   * e.g. { "allowedFeatures": ["payments", "complaints"] }
   */
  @Column({ type: 'jsonb', nullable: true, default: () => "'{}'" })
  settings: Record<string, unknown>;
}
