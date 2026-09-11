import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AssetsService } from './assets.service';

export const ASSETS_QUEUE = 'assets';

@Processor(ASSETS_QUEUE)
export class AssetsScheduler extends WorkerHost {
  private readonly logger = new Logger(AssetsScheduler.name);

  constructor(private readonly assetsService: AssetsService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing asset queue job: ${job.name}`);

    switch (job.name) {
      case 'check-warranty-expiries': {
        await this.assetsService.checkWarrantyExpiries();
        this.logger.log('Warranty expiry check complete');
        break;
      }

      case 'check-amc-expiries': {
        await this.assetsService.checkAmcExpiries();
        this.logger.log('AMC expiry check complete');
        break;
      }

      case 'check-due-maintenance': {
        await this.assetsService.checkDueMaintenance();
        this.logger.log('Due-maintenance check complete');
        break;
      }

      default:
        this.logger.warn(`Unknown asset job: ${job.name}`);
    }
  }
}
