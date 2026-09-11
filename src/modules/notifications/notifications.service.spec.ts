import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { NotificationsService, NOTIFICATIONS_QUEUE } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { NotificationChannel, NotificationStatus, NotificationType } from '../../common/enums/notification.enum';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const mockNotifRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(Notification), useValue: mockNotifRepo },
        { provide: getQueueToken(NOTIFICATIONS_QUEUE), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('send', () => {
    it('should immediately mark IN_APP notifications as SENT (happy path)', async () => {
      const mockNotif = {
        id: 'notif-1',
        userId: 'u-1',
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.PENDING,
      };
      mockNotifRepo.create.mockReturnValue(mockNotif);
      mockNotifRepo.save.mockImplementation(async (n) => n);

      const result = await service.send({
        userId: 'u-1',
        type: NotificationType.GENERAL,
        channel: NotificationChannel.IN_APP,
        body: 'Your gate pass is ready',
      });

      expect(result.status).toBe(NotificationStatus.SENT);
      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('should enqueue email notifications to BullMQ queue', async () => {
      const mockNotif = {
        id: 'notif-2',
        userId: 'u-1',
        channel: NotificationChannel.EMAIL,
        status: NotificationStatus.PENDING,
      };
      mockNotifRepo.create.mockReturnValue(mockNotif);
      mockNotifRepo.save.mockImplementation(async (n) => n);

      const result = await service.send({
        userId: 'u-1',
        type: NotificationType.INVOICE_GENERATED,
        channel: NotificationChannel.EMAIL,
        body: 'Maintenance invoice attached',
      });

      expect(mockQueue.add).toHaveBeenCalledWith('send', { notificationId: 'notif-2' });
    });
  });

  describe('markRead', () => {
    it('should update readAt timestamp scoped to userId', async () => {
      await service.markRead('u-1', 'notif-1');

      expect(mockNotifRepo.update).toHaveBeenCalledWith(
        { id: 'notif-1', userId: 'u-1' },
        { readAt: expect.any(Date) },
      );
    });
  });
});
