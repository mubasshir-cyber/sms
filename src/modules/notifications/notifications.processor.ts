import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsService, NOTIFICATIONS_QUEUE } from './notifications.service';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { NotificationChannel } from '../../common/enums/notification.enum';

@Processor(NOTIFICATIONS_QUEUE)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    @InjectRepository(Notification) private readonly notifRepo: Repository<Notification>,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
  ) {
    super();
  }

  async process(job: Job<{ notificationId: string }>): Promise<void> {
    const { notificationId } = job.data;

    const notif = await this.notifRepo.findOne({ where: { id: notificationId } });
    if (!notif) {
      this.logger.warn(`Notification ${notificationId} not found`);
      return;
    }

    let success = false;
    let errorMessage: string | undefined;

    try {
      if (notif.channel === NotificationChannel.EMAIL) {
        const email = notif.payload?.email as string | undefined;
        if (email) {
          success = await this.emailService.send({
            to: email,
            subject: notif.subject ?? 'Society Notification',
            text: notif.body,
          });
        } else {
          this.logger.warn(`No email in payload for notification ${notificationId}`);
          success = false;
          errorMessage = 'No email address in payload';
        }
      } else if (notif.channel === NotificationChannel.SMS) {
        const phone = notif.payload?.phone as string | undefined;
        if (phone) {
          success = await this.smsService.send({ to: phone, body: notif.body });
        } else {
          this.logger.warn(`No phone in payload for notification ${notificationId}`);
          success = false;
          errorMessage = 'No phone number in payload';
        }
      }
    } catch (err) {
      errorMessage = (err as Error).message;
      success = false;
    }

    await this.notificationsService.markDelivered(notificationId, success, errorMessage);
  }
}
