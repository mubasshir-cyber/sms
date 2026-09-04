import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Complaint } from './entities/complaint.entity';
import { ComplaintComment } from './entities/complaint-comment.entity';
import { SlaConfig } from './entities/sla-config.entity';
import { ComplaintsService } from './complaints.service';
import { ComplaintsController } from './complaints.controller';
import { SlaCheckerProcessor, SLA_QUEUE } from './sla-checker.scheduler';
import { NotificationsModule } from '../notifications/notifications.module';

/** Every 30 minutes in milliseconds */
const SLA_CHECK_INTERVAL_MS = 30 * 60 * 1000;

@Module({
  imports: [
    TypeOrmModule.forFeature([Complaint, ComplaintComment, SlaConfig]),
    BullModule.registerQueue({ name: SLA_QUEUE }),
    NotificationsModule,
  ],
  controllers: [ComplaintsController],
  providers: [ComplaintsService, SlaCheckerProcessor],
  exports: [ComplaintsService],
})
export class ComplaintsModule implements OnModuleInit {
  private readonly logger = new Logger(ComplaintsModule.name);

  constructor(@InjectQueue(SLA_QUEUE) private readonly slaQueue: Queue) {}

  /**
   * Register a repeatable BullMQ job that fires every 30 minutes.
   *
   * BullMQ v6 uses queue.jobScheduler.upsertJobScheduler() for this.
   * The stable schedulerId prevents duplicate schedulers on every restart.
   */
  async onModuleInit(): Promise<void> {
    try {
      const scheduler = await this.slaQueue.jobScheduler;
      await scheduler.upsertJobScheduler(
        'sla-check-repeatable',          // stable scheduler ID (idempotent)
        { every: SLA_CHECK_INTERVAL_MS }, // repeat every 30 min
        'check-sla',                      // job name (matched in processor)
        {},                               // job data
        { removeOnComplete: true, removeOnFail: false },
        { override: false },              // don't override if already exists
      );
      this.logger.log('SLA checker scheduled: every 30 minutes');
    } catch (error) {
      this.logger.error(
        'Failed to register SLA repeatable job',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
