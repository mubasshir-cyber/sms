import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MaintenanceService } from './maintenance.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Society } from '../societies/entities/society.entity';

export const BILLING_QUEUE = 'billing';

export interface GenerateInvoicesJobData {
  societyId: string;
  month: number;
  year: number;
}

export interface ApplyLateFeesJobData {
  societyId: string;
}

@Processor(BILLING_QUEUE)
export class BillingScheduler extends WorkerHost {
  private readonly logger = new Logger(BillingScheduler.name);

  constructor(
    private readonly maintenanceService: MaintenanceService,
    @InjectRepository(Society)
    private readonly societiesRepo: Repository<Society>,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing billing job: ${job.name}`);

    switch (job.name) {
      case 'generate-invoices': {
        const data = job.data as GenerateInvoicesJobData;
        const result = await this.maintenanceService.generateInvoices(data.societyId, {
          month: data.month,
          year: data.year,
        });
        this.logger.log(
          `Auto-invoicing: society=${data.societyId} generated=${result.generated} skipped=${result.skipped}`,
        );
        break;
      }

      case 'apply-late-fees': {
        const data = job.data as ApplyLateFeesJobData;
        const updated = await this.maintenanceService.applyLateFees(data.societyId);
        this.logger.log(`Late fees applied: society=${data.societyId} updated=${updated}`);
        break;
      }

      case 'monthly-all-societies': {
        // Triggered on the 1st of every month — generates invoices for ALL active societies
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const societies = await this.societiesRepo.find({ where: { isActive: true } });
        for (const society of societies) {
          await this.maintenanceService.generateInvoices(society.id, { month, year });
        }
        this.logger.log(`Monthly invoicing complete: ${societies.length} societies`);
        break;
      }

      default:
        this.logger.warn(`Unknown billing job: ${job.name}`);
    }
  }
}
