import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Announcement } from './entities/announcement.entity';
import { AnnouncementRead } from './entities/announcement-read.entity';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsProcessor, ANNOUNCEMENTS_QUEUE } from './announcements.processor';
import { NotificationsModule } from '../notifications/notifications.module';

/** Daily archive sweep: 2:00 AM every day */
const ARCHIVE_SWEEP_CRON = '0 2 * * *';

@Module({
  imports: [
    TypeOrmModule.forFeature([Announcement, AnnouncementRead]),
    BullModule.registerQueue({ name: ANNOUNCEMENTS_QUEUE }),
    NotificationsModule,
  ],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService, AnnouncementsProcessor],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule implements OnModuleInit {
  private readonly logger = new Logger(AnnouncementsModule.name);

  constructor(
    @InjectQueue(ANNOUNCEMENTS_QUEUE) private readonly announcementsQueue: Queue,
    private readonly announcementsService: AnnouncementsService,
  ) {}

  /**
   * Inject queue into service and register repeatable daily archive sweep.
   */
  async onModuleInit(): Promise<void> {
    // Wire queue into service (avoids ESM test issues with @InjectQueue in service)
    this.announcementsService.setQueue(this.announcementsQueue);

    try {
      const scheduler = await this.announcementsQueue.jobScheduler;
      await scheduler.upsertJobScheduler(
        'announcements-archive-expired-daily',
        { pattern: ARCHIVE_SWEEP_CRON },
        'archive-expired',
        { type: 'archive_expired' },
        { removeOnComplete: true, removeOnFail: false },
        { override: false },
      );
      this.logger.log('Announcements daily archive sweep scheduled: 2:00 AM');
    } catch (error) {
      this.logger.error(
        'Failed to register announcements archive sweep job',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
