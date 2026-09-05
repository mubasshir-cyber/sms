import { Entity, Column, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * Tracks per-user read acknowledgements for announcements.
 * One row per (announcementId, userId) — unique constraint prevents duplicates.
 * markAsRead is idempotent: upsert on conflict do nothing.
 */
@Entity('announcement_reads')
@Unique(['announcementId', 'userId'])
@Index(['announcementId'])
@Index(['userId'])
export class AnnouncementRead extends BaseEntity {
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Column({ name: 'announcement_id', type: 'uuid' })
  announcementId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'read_at', type: 'timestamp' })
  readAt: Date;
}
