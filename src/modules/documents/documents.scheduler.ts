import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DocumentsService } from './documents.service';

export const DOCUMENTS_QUEUE = 'documents';

@Processor(DOCUMENTS_QUEUE)
export class DocumentsScheduler extends WorkerHost {
  private readonly logger = new Logger(DocumentsScheduler.name);

  constructor(private readonly documentsService: DocumentsService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing document queue job: ${job.name}`);

    switch (job.name) {
      case 'check-document-expiries': {
        await this.documentsService.checkExpiryAlerts();
        this.logger.log('Document expiry check complete');
        break;
      }

      default:
        this.logger.warn(`Unknown document job: ${job.name}`);
    }
  }
}
