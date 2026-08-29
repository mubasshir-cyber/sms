import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { MaintenanceHead } from './entities/maintenance-head.entity';
import { BillingRule } from './entities/billing-rule.entity';
import { LateFeeConfig } from './entities/late-fee-config.entity';
import { Invoice } from './entities/invoice.entity';
import { Society } from '../societies/entities/society.entity';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { BillingScheduler, BILLING_QUEUE } from './billing.scheduler';
import { StructureModule } from '../structure/structure.module';
import { SocietiesModule } from '../societies/societies.module';
import { PdfService } from '../../common/services/pdf.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MaintenanceHead, BillingRule, LateFeeConfig, Invoice, Society]),
    BullModule.registerQueue({ name: BILLING_QUEUE }),
    StructureModule,
    SocietiesModule,
  ],
  controllers: [MaintenanceController],
  providers: [MaintenanceService, BillingScheduler, PdfService],
  exports: [MaintenanceService, PdfService],
})
export class MaintenanceModule {}
