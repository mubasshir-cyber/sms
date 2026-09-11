import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

describe('NotificationsController', () => {
  let controller: NotificationsController;

  const mockNotificationsService = {
    findMyNotifications: jest.fn(),
    getUnreadCount: jest.fn(),
    markAllRead: jest.fn(),
    markRead: jest.fn(),
  };

  const dummyUser: AuthUser = {
    sub: 'u-1',
    email: 'resident@soc.com',
    role: Role.RESIDENT,
    societyId: 'soc-1',
    iat: 0,
    exp: 0,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  describe('findMine', () => {
    it('should return notifications for user', async () => {
      mockNotificationsService.findMyNotifications.mockResolvedValueOnce([{ id: 'notif-1' }]);

      const res = await controller.findMine(dummyUser, '1', '20');

      expect(res).toHaveLength(1);
      expect(mockNotificationsService.findMyNotifications).toHaveBeenCalledWith('u-1', 1, 20);
    });
  });

  describe('unreadCount', () => {
    it('should return unread count for user', async () => {
      mockNotificationsService.getUnreadCount.mockResolvedValueOnce(3);

      const res = await controller.unreadCount(dummyUser);

      expect(res).toBe(3);
      expect(mockNotificationsService.getUnreadCount).toHaveBeenCalledWith('u-1');
    });
  });
});
