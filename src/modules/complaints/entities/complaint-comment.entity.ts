import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Role } from '../../../common/enums/role.enum';

/**
 * ComplaintComment Entity — a single message in the complaint thread.
 * Supports internal-only notes for admin/staff that residents cannot see.
 *
 * Table: complaint_comments
 */
@Entity('complaint_comments')
export class ComplaintComment extends BaseEntity {
  @Index('IDX_complaint_comments_complaint_id')
  @Column({ name: 'complaint_id', type: 'uuid' })
  complaintId: string;

  /** The user who posted this comment */
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  /** Stored role at time of posting — used for display (Admin / Resident label) */
  @Column({ name: 'user_role', type: 'enum', enum: Role })
  userRole: Role;

  /** Display name snapshot — avoids joining users table on every fetch */
  @Column({ name: 'user_name', type: 'varchar', length: 150 })
  userName: string;

  @Column({ type: 'text' })
  message: string;

  /**
   * If true, only admin-level roles can see this comment.
   * Residents will not receive this comment in their view.
   */
  @Column({ name: 'is_internal', type: 'boolean', default: false })
  isInternal: boolean;
}
