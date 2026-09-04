import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ComplaintsService } from './complaints.service';

export const SLA_QUEUE = 'sla';

/**
 * SlaCheckerProcessor — BullMQ worker that processes SLA check jobs.
 *
 * A repeatable job is registered in ComplaintsModule to fire every 30 minutes,
 * which invokes this processor to auto-escalate breached complaints.
 */
@Processor(SLA_QUEUE)
export class SlaCheckerProcessor extends WorkerHost {
  private readonly logger = new Logger(SlaCheckerProcessor.name);

  constructor(private readonly complaintsService: ComplaintsService) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name !== 'check-sla') {
      this.logger.warn(`Unknown SLA job: ${job.name}`);
      return;
    }

    this.logger.log('SLA checker running — scanning for breached complaints...');

    try {
      const breached = await this.complaintsService.findSlaBreached();

      if (breached.length === 0) {
        this.logger.log('SLA checker: no breaches found');
        return;
      }

      this.logger.warn(`SLA checker: ${breached.length} complaint(s) breached SLA`);

      await Promise.allSettled(
        breached.map(complaint =>
          this.complaintsService.escalateComplaint(complaint.id, complaint.societyId),
        ),
      );

      this.logger.warn(`SLA checker: escalated ${breached.length} complaint(s)`);
    } catch (error) {
      this.logger.error(
        'SLA checker failed',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
