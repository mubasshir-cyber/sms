import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
} from '../../../common/enums/complaint.enum';

/**
 * Complaint Entity — represents a resident's helpdesk ticket.
 *
 * Table: complaints
 */
@Entity('complaints')
export class Complaint extends BaseEntity {
  @Index('IDX_complaints_society_id')
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Index('IDX_complaints_unit_id')
  @Column({ name: 'unit_id', type: 'uuid' })
  unitId: string;

  @Index('IDX_complaints_resident_id')
  @Column({ name: 'resident_id', type: 'uuid' })
  residentId: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ComplaintCategory,
    default: ComplaintCategory.OTHER,
  })
  category: ComplaintCategory;

  @Index('IDX_complaints_priority')
  @Column({
    type: 'enum',
    enum: ComplaintPriority,
    default: ComplaintPriority.MEDIUM,
  })
  priority: ComplaintPriority;

  @Index('IDX_complaints_status')
  @Column({
    type: 'enum',
    enum: ComplaintStatus,
    default: ComplaintStatus.OPEN,
  })
  status: ComplaintStatus;

  /** S3 / Cloudflare R2 URLs for photos attached at creation */
  @Column({ name: 'photo_urls', type: 'jsonb', default: () => "'[]'" })
  photoUrls: string[];

  /** User ID of the staff member / facility manager assigned */
  @Index('IDX_complaints_assigned_to')
  @Column({ name: 'assigned_to_user_id', type: 'uuid', nullable: true })
  assignedToUserId: string | null;

  /** SLA deadline — calculated from SlaConfig on assignment */
  @Column({ name: 'sla_deadline', type: 'timestamp', nullable: true })
  slaDeadline: Date | null;

  /** Set when status transitions to RESOLVED */
  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: Date | null;

  /** Set when resident confirms and closes the complaint */
  @Column({ name: 'closed_at', type: 'timestamp', nullable: true })
  closedAt: Date | null;

  /** Set when BullMQ SLA job auto-escalates */
  @Column({ name: 'escalated_at', type: 'timestamp', nullable: true })
  escalatedAt: Date | null;

  @Column({ name: 'is_escalated', type: 'boolean', default: false })
  isEscalated: boolean;

  /** Resident star rating (1–5) filled when closing */
  @Column({ name: 'resident_rating', type: 'int', nullable: true })
  residentRating: number | null;

  /** Optional feedback text when closing */
  @Column({ name: 'resident_feedback', type: 'text', nullable: true })
  residentFeedback: string | null;

  /** Internal admin notes / remarks */
  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
