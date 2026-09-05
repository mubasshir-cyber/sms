import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DeliveriesService } from './deliveries.service';

export const DELIVERIES_QUEUE = 'deliveries';

/**
 * DeliveriesProcessor — BullMQ worker that processes delivery tasks.
 *
 * Runs a periodic scanner to detect unattended parcels (> 24 hours at the gate)
 * and trigger reminder notifications to residents.
 */
@Processor(DELIVERIES_QUEUE)
export class DeliveriesProcessor extends WorkerHost {
  private readonly logger = new Logger(DeliveriesProcessor.name);

  constructor(private readonly deliveriesService: DeliveriesService) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name !== 'check-unattended-parcels') {
      this.logger.warn(`Unknown delivery job: ${job.name}`);
      return;
    }

    this.logger.log('Deliveries processor running — scanning for unattended parcels...');

    try {
      const result = await this.deliveriesService.processUnattendedParcels();
      this.logger.log(`Unattended parcel scan complete: alerted ${result.processedCount} parcel(s).`);
    } catch (error) {
      this.logger.error(
        'Deliveries unattended parcel scan failed',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
