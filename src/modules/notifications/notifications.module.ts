import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Notification } from './entities/notification.entity';
import { NotificationsService, NOTIFICATIONS_QUEUE } from './notifications.service';
import { NotificationsProcessor } from './notifications.processor';
import { NotificationsController } from './notifications.controller';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    BullModule.registerQueue({ name: NOTIFICATIONS_QUEUE }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsProcessor,
    EmailService,
    SmsService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
