import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { NotificationType, NotificationChannel, NotificationStatus } from '../../../common/enums/notification.enum';

@Entity('notifications')
export class Notification extends BaseEntity {
  @Index('IDX_notif_society_id')
  @Column({ name: 'society_id', type: 'uuid', nullable: true })
  societyId: string | null;

  @Index('IDX_notif_user_id')
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ type: 'enum', enum: NotificationChannel })
  channel: NotificationChannel;

  @Column({ type: 'enum', enum: NotificationStatus, default: NotificationStatus.PENDING })
  status: NotificationStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  subject: string | null;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'jsonb', nullable: true, default: () => "'{}'" })
  payload: Record<string, unknown>;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt: Date | null;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt: Date | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;
}
