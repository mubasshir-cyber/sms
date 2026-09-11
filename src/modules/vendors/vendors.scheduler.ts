import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { VendorsService } from './vendors.service';

export const VENDORS_QUEUE = 'vendors';

@Processor(VENDORS_QUEUE)
export class VendorsScheduler extends WorkerHost {
  private readonly logger = new Logger(VendorsScheduler.name);

  constructor(private readonly vendorsService: VendorsService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing vendor queue job: ${job.name}`);

    switch (job.name) {
      case 'check-contract-expiries': {
        const result = await this.vendorsService.checkContractExpiries();
        this.logger.log(
          `Contract expiries evaluated: checked=${result.checked}, alerted=${result.alerted}`,
        );
        break;
      }

      default:
        this.logger.warn(`Unknown vendor job: ${job.name}`);
    }
  }
}
