import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import {
  AnnouncementType,
  AnnouncementStatus,
  AnnouncementPriority,
  AnnouncementTargetScope,
  AnnouncementTargetRole,
} from '../../../common/enums/announcement.enum';

@Entity('announcements')
@Index(['societyId', 'status', 'isPinned'])
@Index(['societyId', 'type'])
@Index(['societyId', 'publishedAt'])
export class Announcement extends BaseEntity {
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Column({ name: 'title', type: 'varchar', length: 300 })
  title: string;

  /**
   * Rich text body stored as HTML.
   * MUST be sanitized with sanitize-html before storage (security-rules.md §6).
   */
  @Column({ name: 'body', type: 'text' })
  body: string;

  @Column({
    name: 'type',
    type: 'enum',
    enum: AnnouncementType,
    default: AnnouncementType.GENERAL,
  })
  type: AnnouncementType;

  /**
   * Attachment URLs (PDF, images). Stored as PostgreSQL array.
   * Max 5 attachments enforced at DTO layer.
   */
  @Column({
    name: 'attachment_urls',
    type: 'varchar',
    array: true,
    default: '{}',
    nullable: true,
  })
  attachmentUrls: string[] | null;

  // ─── Targeting ────────────────────────────────────────────────────────────

  @Column({
    name: 'target_scope',
    type: 'enum',
    enum: AnnouncementTargetScope,
    default: AnnouncementTargetScope.SOCIETY,
  })
  targetScope: AnnouncementTargetScope;

  /** Set when scope = tower or floor */
  @Column({ name: 'target_tower_id', type: 'uuid', nullable: true })
  targetTowerId: string | null;

  /** Set when scope = floor */
  @Column({ name: 'target_floor_id', type: 'uuid', nullable: true })
  targetFloorId: string | null;

  /** Set when scope = unit */
  @Column({ name: 'target_unit_id', type: 'uuid', nullable: true })
  targetUnitId: string | null;

  /** Set when scope = role_group (owner / tenant / all_residents) */
  @Column({
    name: 'target_role',
    type: 'enum',
    enum: AnnouncementTargetRole,
    nullable: true,
  })
  targetRole: AnnouncementTargetRole | null;

  // ─── Presentation ─────────────────────────────────────────────────────────

  @Column({ name: 'is_pinned', type: 'boolean', default: false })
  isPinned: boolean;

  @Column({
    name: 'priority',
    type: 'enum',
    enum: AnnouncementPriority,
    default: AnnouncementPriority.NORMAL,
  })
  priority: AnnouncementPriority;

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  @Column({
    name: 'status',
    type: 'enum',
    enum: AnnouncementStatus,
    default: AnnouncementStatus.DRAFT,
  })
  status: AnnouncementStatus;

  /**
   * Scheduled future publish time.
   * When set, a BullMQ delayed job is enqueued.
   */
  @Column({ name: 'publish_at', type: 'timestamp', nullable: true })
  publishAt: Date | null;

  /** Actual timestamp when announcement went live */
  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt: Date | null;

  /** Auto-archive after this timestamp (optional) */
  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @Column({ name: 'created_by_user_id', type: 'uuid' })
  createdByUserId: string;
}
