jest.mock('@nestjs/bullmq', () => ({
  InjectQueue: () => () => {},
  Processor: () => () => {},
  WorkerHost: class {},
}));

jest.mock('sanitize-html', () => (html: string) => html.replace(/<script[\s\S]*?<\/script>/gi, ''));

import { Test, TestingModule } from '@nestjs/testing';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from './announcements.service';
import {
  AnnouncementType,
  AnnouncementStatus,
  AnnouncementPriority,
  AnnouncementTargetScope,
} from '../../common/enums/announcement.enum';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

describe('AnnouncementsController', () => {
  let controller: AnnouncementsController;
  let service: any;

  const mockSocietyId = '11111111-1111-1111-1111-111111111111';

  const mockAdmin: AuthUser = {
    sub: '22222222-2222-2222-2222-222222222222',
    email: 'admin@example.com',
    role: Role.SOCIETY_ADMIN,
    societyId: mockSocietyId,
  };

  const mockResident: AuthUser = {
    sub: '33333333-3333-3333-3333-333333333333',
    email: 'resident@example.com',
    role: Role.RESIDENT,
    societyId: mockSocietyId,
  };

  const mockAnnouncementId = '44444444-4444-4444-4444-444444444444';

  const mockAnnouncement = {
    id: mockAnnouncementId,
    societyId: mockSocietyId,
    title: 'Water Supply Disruption',
    body: '<p>Water off 9AM-12PM</p>',
    type: AnnouncementType.WATER_SHUTDOWN,
    status: AnnouncementStatus.DRAFT,
    priority: AnnouncementPriority.HIGH,
    isPinned: false,
    targetScope: AnnouncementTargetScope.SOCIETY,
    createdByUserId: mockAdmin.sub,
  };

  beforeEach(async () => {
    service = {
      createAnnouncement: jest.fn().mockResolvedValue(mockAnnouncement),
      findAnnouncements: jest.fn().mockResolvedValue({
        data: [{ ...mockAnnouncement, status: AnnouncementStatus.PUBLISHED }],
        total: 1, page: 1, limit: 20, totalPages: 1,
      }),
      findById: jest.fn().mockResolvedValue({ ...mockAnnouncement, isRead: false }),
      updateAnnouncement: jest.fn().mockResolvedValue({ ...mockAnnouncement, title: 'Updated Title' }),
      publishAnnouncement: jest.fn().mockResolvedValue({
        ...mockAnnouncement,
        status: AnnouncementStatus.PUBLISHED,
        publishedAt: new Date(),
      }),
      togglePin: jest.fn().mockResolvedValue({ ...mockAnnouncement, isPinned: true }),
      archiveAnnouncement: jest.fn().mockResolvedValue({ ...mockAnnouncement, status: AnnouncementStatus.ARCHIVED }),
      deleteAnnouncement: jest.fn().mockResolvedValue({ success: true }),
      markAsRead: jest.fn().mockResolvedValue({ success: true }),
      getReadReceipt: jest.fn().mockResolvedValue({ readCount: 12, unreadCount: -1, readers: [] }),
      getUnreadCount: jest.fn().mockResolvedValue({ unreadCount: 5 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnnouncementsController],
      providers: [{ provide: AnnouncementsService, useValue: service }],
    }).compile();

    controller = module.get<AnnouncementsController>(AnnouncementsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createAnnouncement', () => {
    it('should delegate to service and return draft', async () => {
      const dto = {
        title: 'Water Supply Disruption',
        body: '<p>Water off</p>',
        type: AnnouncementType.WATER_SHUTDOWN,
      };
      const result = await controller.createAnnouncement(mockAdmin, dto as any);
      expect(service.createAnnouncement).toHaveBeenCalledWith(mockAdmin, dto);
      expect(result.status).toBe(AnnouncementStatus.DRAFT);
    });
  });

  describe('findAnnouncements', () => {
    it('should return paginated announcement feed', async () => {
      const result = await controller.findAnnouncements(mockResident, { page: 1, limit: 20 });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread badge count', async () => {
      const result = await controller.getUnreadCount(mockResident);
      expect(result.unreadCount).toBe(5);
    });
  });

  describe('findById', () => {
    it('should return announcement with isRead status', async () => {
      const result = await controller.findById(mockAdmin, mockAnnouncementId);
      expect(result.isRead).toBe(false);
    });
  });

  describe('publishAnnouncement', () => {
    it('should publish immediately when no publishAt given', async () => {
      const result = await controller.publishAnnouncement(mockAdmin, mockAnnouncementId, {});
      expect(service.publishAnnouncement).toHaveBeenCalledWith(mockAdmin, mockAnnouncementId, {});
      expect(result.status).toBe(AnnouncementStatus.PUBLISHED);
    });

    it('should schedule when publishAt is provided', async () => {
      const futureDate = new Date(Date.now() + 3_600_000).toISOString();
      service.publishAnnouncement.mockResolvedValueOnce({
        ...mockAnnouncement,
        status: AnnouncementStatus.SCHEDULED,
        publishAt: futureDate,
      });
      const result = await controller.publishAnnouncement(mockAdmin, mockAnnouncementId, { publishAt: futureDate });
      expect(result.status).toBe(AnnouncementStatus.SCHEDULED);
    });
  });

  describe('togglePin', () => {
    it('should toggle pin and return updated announcement', async () => {
      const result = await controller.togglePin(mockAdmin, mockAnnouncementId);
      expect(result.isPinned).toBe(true);
    });
  });

  describe('archiveAnnouncement', () => {
    it('should archive an announcement', async () => {
      const result = await controller.archiveAnnouncement(mockAdmin, mockAnnouncementId);
      expect(result.status).toBe(AnnouncementStatus.ARCHIVED);
    });
  });

  describe('markAsRead', () => {
    it('should return success: true', async () => {
      const result = await controller.markAsRead(mockResident, mockAnnouncementId);
      expect(result.success).toBe(true);
    });
  });

  describe('getReadReceipt', () => {
    it('should return read count for admin view', async () => {
      const result = await controller.getReadReceipt(mockAdmin, mockAnnouncementId);
      expect(result.readCount).toBe(12);
    });
  });
});
