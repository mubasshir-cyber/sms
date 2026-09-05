import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Delivery } from './entities/delivery.entity';
import { Gate } from '../visitors/entities/gate.entity';
import { Unit } from '../structure/entities/unit.entity';
import { Resident } from '../residents/entities/resident.entity';
import { DeliveriesService } from './deliveries.service';
import { DeliveriesController } from './deliveries.controller';
import { DeliveriesProcessor, DELIVERIES_QUEUE } from './deliveries.processor';
import { NotificationsModule } from '../notifications/notifications.module';

/** Scan every 1 hour in milliseconds */
const UNATTENDED_PARCEL_SCAN_INTERVAL_MS = 60 * 60 * 1000;

@Module({
  imports: [
    TypeOrmModule.forFeature([Delivery, Gate, Unit, Resident]),
    BullModule.registerQueue({ name: DELIVERIES_QUEUE }),
    NotificationsModule,
  ],
  controllers: [DeliveriesController],
  providers: [DeliveriesService, DeliveriesProcessor],
  exports: [DeliveriesService],
})
export class DeliveriesModule implements OnModuleInit {
  private readonly logger = new Logger(DeliveriesModule.name);

  constructor(@InjectQueue(DELIVERIES_QUEUE) private readonly deliveriesQueue: Queue) {}

  /**
   * Register a repeatable BullMQ job that fires every hour to scan for unattended parcels.
   */
  async onModuleInit(): Promise<void> {
    try {
      const scheduler = await this.deliveriesQueue.jobScheduler;
      await scheduler.upsertJobScheduler(
        'deliveries-unattended-scan-repeatable',
        { every: UNATTENDED_PARCEL_SCAN_INTERVAL_MS },
        'check-unattended-parcels',
        {},
        { removeOnComplete: true, removeOnFail: false },
        { override: false },
      );
      this.logger.log('Deliveries unattended parcel scanner scheduled: every 1 hour');
    } catch (error) {
      this.logger.error(
        'Failed to register deliveries unattended scan repeatable job',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
