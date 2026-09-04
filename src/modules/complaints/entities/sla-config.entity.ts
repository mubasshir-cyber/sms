import { Entity, Column, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ComplaintCategory } from '../../../common/enums/complaint.enum';

/**
 * SlaConfig Entity — SLA time limits per complaint category per society.
 * Used by the SLA checker job to auto-escalate breached complaints.
 *
 * Table: sla_configs
 * Unique: one config per (society_id, category)
 */
@Entity('sla_configs')
@Unique('UQ_sla_configs_society_category', ['societyId', 'category'])
export class SlaConfig extends BaseEntity {
  @Index('IDX_sla_configs_society_id')
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Column({ type: 'enum', enum: ComplaintCategory })
  category: ComplaintCategory;

  /**
   * Number of hours within which the complaint must be resolved.
   * e.g., 24 = resolve within 24 hours of assignment.
   */
  @Column({ name: 'resolution_hours', type: 'int' })
  resolutionHours: number;

  /**
   * Number of hours after which, if still unresolved, the complaint is
   * auto-escalated. Must be > resolutionHours.
   * e.g., 48 = escalate if not resolved within 48 hours.
   */
  @Column({ name: 'escalation_hours', type: 'int' })
  escalationHours: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
