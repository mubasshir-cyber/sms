import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Asset } from './entities/asset.entity';
import { AssetMaintenanceLog } from './entities/asset-maintenance-log.entity';
import { AssetMaintenanceSchedule } from './entities/asset-maintenance-schedule.entity';
import { AssetDepreciationLog } from './entities/asset-depreciation-log.entity';
import { AssetsService } from './assets.service';
import { AssetsScheduler, ASSETS_QUEUE } from './assets.scheduler';
import { AssetsController } from './assets.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Asset,
      AssetMaintenanceLog,
      AssetMaintenanceSchedule,
      AssetDepreciationLog,
    ]),
    BullModule.registerQueue({
      name: ASSETS_QUEUE,
    }),
    NotificationsModule,
  ],
  controllers: [AssetsController],
  providers: [AssetsService, AssetsScheduler],
  exports: [AssetsService],
})
export class AssetsModule {}
