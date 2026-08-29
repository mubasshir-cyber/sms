import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Notification } from './entities/notification.entity';
import { NotificationType, NotificationChannel, NotificationStatus } from '../../common/enums/notification.enum';

export const NOTIFICATIONS_QUEUE = 'notifications';

export interface SendNotificationDto {
  userId: string;
  societyId?: string;
  type: NotificationType;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  payload?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification) private readonly notifRepo: Repository<Notification>,
    @InjectQueue(NOTIFICATIONS_QUEUE) private readonly notifQueue: Queue,
  ) {}

  /**
   * Enqueue a notification for async delivery.
   * Creates a DB record immediately (for in-app), then queues email/SMS.
   */
  async send(dto: SendNotificationDto): Promise<Notification> {
    const notif = this.notifRepo.create({
      userId: dto.userId,
      societyId: dto.societyId ?? null,
      type: dto.type,
      channel: dto.channel,
      status: NotificationStatus.PENDING,
      subject: dto.subject ?? null,
      body: dto.body,
      payload: dto.payload ?? {},
    });
    const saved = await this.notifRepo.save(notif);

    if (dto.channel !== NotificationChannel.IN_APP) {
      await this.notifQueue.add('send', { notificationId: saved.id });
    } else {
      // In-app notifications are instantly "sent"
      saved.status = NotificationStatus.SENT;
      saved.sentAt = new Date();
      await this.notifRepo.save(saved);
    }

    return saved;
  }

  /** Convenience: send to multiple users */
  async sendBulk(dtos: SendNotificationDto[]): Promise<void> {
    await Promise.all(dtos.map(dto => this.send(dto)));
  }

  // ─── User-facing queries ──────────────────────────────────────────────────

  async findMyNotifications(userId: string, page = 1, limit = 20): Promise<Notification[]> {
    return this.notifRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });
  }

  async markRead(userId: string, notifId: string): Promise<void> {
    await this.notifRepo.update({ id: notifId, userId }, { readAt: new Date() });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notifRepo
      .createQueryBuilder()
      .update()
      .set({ readAt: new Date() })
      .where('user_id = :userId AND read_at IS NULL', { userId })
      .execute();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notifRepo
      .createQueryBuilder('n')
      .where('n.user_id = :userId AND n.read_at IS NULL', { userId })
      .getCount();
  }

  /** Internal — update status after delivery attempt */
  async markDelivered(notifId: string, success: boolean, error?: string): Promise<void> {
    await this.notifRepo.update(notifId, {
      status: success ? NotificationStatus.SENT : NotificationStatus.FAILED,
      sentAt: success ? new Date() : undefined,
      errorMessage: error ?? null,
    });
  }
}
