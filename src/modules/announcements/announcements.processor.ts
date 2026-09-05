import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Announcement } from './entities/announcement.entity';
import { AnnouncementStatus } from '../../common/enums/announcement.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationChannel } from '../../common/enums/notification.enum';

export const ANNOUNCEMENTS_QUEUE = 'announcements';

export interface PublishAnnouncementJobData {
  announcementId: string;
  societyId: string;
}

export interface ArchiveExpiredJobData {
  type: 'archive_expired';
}

@Processor(ANNOUNCEMENTS_QUEUE)
export class AnnouncementsProcessor extends WorkerHost {
  private readonly logger = new Logger(AnnouncementsProcessor.name);

  constructor(
    @InjectRepository(Announcement)
    private readonly announcementsRepo: Repository<Announcement>,
    private readonly notificationsService: NotificationsService,
  ) {
    super();
  }

  async process(job: Job<PublishAnnouncementJobData | ArchiveExpiredJobData>): Promise<void> {
    if ('type' in job.data && job.data.type === 'archive_expired') {
      return this.archiveExpired();
    }
    return this.publishScheduled(job as Job<PublishAnnouncementJobData>);
  }

  /**
   * Called by the delayed BullMQ job when `publishAt` time is reached.
   * Sets status → published, publishedAt → now, then fires bulk notification.
   */
  private async publishScheduled(job: Job<PublishAnnouncementJobData>): Promise<void> {
    const { announcementId, societyId } = job.data;
    this.logger.log(`Publishing scheduled announcement ${announcementId}`);

    const announcement = await this.announcementsRepo.findOne({
      where: { id: announcementId, societyId, status: AnnouncementStatus.SCHEDULED },
    });

    if (!announcement) {
      this.logger.warn(`Announcement ${announcementId} not found or already processed — skipping`);
      return;
    }

    announcement.status = AnnouncementStatus.PUBLISHED;
    announcement.publishedAt = new Date();
    await this.announcementsRepo.save(announcement);

    // Fire society-wide notification — targeting is handled by NotificationsService.sendBulk
    try {
      await this.notificationsService.send({
        userId: announcement.createdByUserId,
        societyId,
        type: NotificationType.ANNOUNCEMENT_PUBLISHED,
        channel: NotificationChannel.IN_APP,
        subject: `📢 ${announcement.title}`,
        body: announcement.body.replace(/<[^>]+>/g, '').slice(0, 200), // strip HTML for notification body
        payload: { announcementId, type: announcement.type, priority: announcement.priority },
      });
    } catch (err) {
      this.logger.warn(`Failed to send notification for announcement ${announcementId}:`, err);
    }

    this.logger.log(`Announcement ${announcementId} published successfully`);
  }

  /**
   * Repeatable daily job: sweeps announcements whose expiresAt has passed
   * and sets them to ARCHIVED status.
   */
  private async archiveExpired(): Promise<void> {
    const now = new Date();
    const result = await this.announcementsRepo
      .createQueryBuilder()
      .update(Announcement)
      .set({ status: AnnouncementStatus.ARCHIVED })
      .where('expires_at IS NOT NULL')
      .andWhere('expires_at < :now', { now })
      .andWhere('status IN (:...statuses)', {
        statuses: [AnnouncementStatus.PUBLISHED, AnnouncementStatus.SCHEDULED],
      })
      .execute();

    this.logger.log(`Archived ${result.affected ?? 0} expired announcement(s)`);
  }
}
