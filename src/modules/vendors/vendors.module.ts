import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Vendor } from './entities/vendor.entity';
import { VendorContract } from './entities/vendor-contract.entity';
import { VendorAmcSchedule } from './entities/vendor-amc-schedule.entity';
import { VendorInvoice } from './entities/vendor-invoice.entity';
import { VendorReview } from './entities/vendor-review.entity';
import { VendorsService } from './vendors.service';
import { VendorsScheduler, VENDORS_QUEUE } from './vendors.scheduler';
import { VendorsController } from './vendors.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Vendor,
      VendorContract,
      VendorAmcSchedule,
      VendorInvoice,
      VendorReview,
    ]),
    BullModule.registerQueue({
      name: VENDORS_QUEUE,
    }),
    NotificationsModule,
  ],
  controllers: [VendorsController],
  providers: [VendorsService, VendorsScheduler],
  exports: [VendorsService],
})
export class VendorsModule {}
