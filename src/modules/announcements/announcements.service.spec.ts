jest.mock('@nestjs/bullmq', () => ({
  InjectQueue: () => () => {},
  Processor: () => () => {},
  WorkerHost: class {},
}));

jest.mock('sanitize-html', () => (html: string) => html.replace(/<script[\s\S]*?<\/script>/gi, ''));

// Token produced by getQueueToken('announcements') === 'BullQueue_announcements'
const ANNOUNCEMENTS_QUEUE_TOKEN = 'BullQueue_announcements';

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { Announcement } from './entities/announcement.entity';
import { AnnouncementRead } from './entities/announcement-read.entity';
import { NotificationsService } from '../notifications/notifications.service';
import {
  AnnouncementType,
  AnnouncementStatus,
  AnnouncementPriority,
  AnnouncementTargetScope,
} from '../../common/enums/announcement.enum';
import { Role } from '../../common/enums/role.enum';
import { ANNOUNCEMENTS_QUEUE } from './announcements.processor';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

describe('AnnouncementsService', () => {
  let service: AnnouncementsService;
  let announcementsRepo: any;
  let readsRepo: any;
  let queue: any;
  let notificationsService: any;

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

  const mockAnnouncement: Announcement = {
    id: '44444444-4444-4444-4444-444444444444',
    societyId: mockSocietyId,
    title: 'Water Supply Disruption',
    body: '<p>Water will be unavailable 9AM-12PM on 7th Sept.</p>',
    type: AnnouncementType.WATER_SHUTDOWN,
    attachmentUrls: null,
    targetScope: AnnouncementTargetScope.SOCIETY,
    targetTowerId: null,
    targetFloorId: null,
    targetUnitId: null,
    targetRole: null,
    isPinned: false,
    priority: AnnouncementPriority.HIGH,
    status: AnnouncementStatus.DRAFT,
    publishAt: null,
    publishedAt: null,
    expiresAt: null,
    createdByUserId: mockAdmin.sub,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const createQBMock = () => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    into: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    orIgnore: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[mockAnnouncement], 1]),
    getMany: jest.fn().mockResolvedValue([mockAnnouncement]),
    getCount: jest.fn().mockResolvedValue(3),
    execute: jest.fn().mockResolvedValue({ affected: 1 }),
  });

  beforeEach(async () => {
    announcementsRepo = {
      create: jest.fn().mockImplementation(dto => ({ ...dto })),
      save: jest.fn().mockImplementation(entity => Promise.resolve({ ...mockAnnouncement, ...entity })),
      findOne: jest.fn().mockImplementation(() => Promise.resolve({ ...mockAnnouncement })),
      softRemove: jest.fn().mockImplementation(entity => Promise.resolve({ ...mockAnnouncement, ...entity })),
      createQueryBuilder: jest.fn().mockReturnValue(createQBMock()),
    };

    readsRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      find: jest.fn().mockResolvedValue([{ userId: mockAdmin.sub, readAt: new Date() }]),
      createQueryBuilder: jest.fn().mockReturnValue(createQBMock()),
    };

    queue = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
      getJob: jest.fn().mockResolvedValue({ remove: jest.fn() }),
      jobScheduler: Promise.resolve({ upsertJobScheduler: jest.fn() }),
    };

    notificationsService = {
      send: jest.fn().mockResolvedValue({ id: 'notif-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnouncementsService,
        { provide: getRepositoryToken(Announcement), useValue: announcementsRepo },
        { provide: getRepositoryToken(AnnouncementRead), useValue: readsRepo },
        { provide: ANNOUNCEMENTS_QUEUE_TOKEN, useValue: queue },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get<AnnouncementsService>(AnnouncementsService);
    service.setQueue(queue);
  });

  // ─── createAnnouncement ───────────────────────────────────────────────────

  describe('createAnnouncement', () => {
    it('should create a draft announcement', async () => {
      const result = await service.createAnnouncement(mockAdmin, {
        title: 'Water Supply Disruption',
        body: '<p>Water off 9AM-12PM</p>',
        type: AnnouncementType.WATER_SHUTDOWN,
        priority: AnnouncementPriority.HIGH,
      });
      expect(result).toBeDefined();
      expect(announcementsRepo.save).toHaveBeenCalled();
    });

    it('should sanitize the HTML body before saving', async () => {
      const capturedCreate: any[] = [];
      announcementsRepo.create = jest.fn().mockImplementation(dto => {
        capturedCreate.push(dto);
        return dto;
      });

      await service.createAnnouncement(mockAdmin, {
        title: 'Test',
        body: '<p>Safe</p><script>alert("xss")</script>',
      });

      expect(capturedCreate[0].body).not.toContain('<script>');
      expect(capturedCreate[0].body).toContain('<p>Safe</p>');
    });
  });

  // ─── updateAnnouncement ───────────────────────────────────────────────────

  describe('updateAnnouncement', () => {
    it('should update a draft announcement', async () => {
      const result = await service.updateAnnouncement(mockAdmin, mockAnnouncement.id, {
        title: 'Updated Title',
      });
      expect(result).toBeDefined();
      expect(announcementsRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequest when trying to edit a published announcement', async () => {
      announcementsRepo.findOne.mockResolvedValueOnce({
        ...mockAnnouncement,
        status: AnnouncementStatus.PUBLISHED,
      });
      await expect(
        service.updateAnnouncement(mockAdmin, mockAnnouncement.id, { title: 'New title' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw Forbidden when non-author non-admin tries to edit', async () => {
      announcementsRepo.findOne.mockResolvedValueOnce({
        ...mockAnnouncement,
        createdByUserId: 'someone-else',
      });
      const nonAdmin: AuthUser = { ...mockResident };
      await expect(
        service.updateAnnouncement(nonAdmin, mockAnnouncement.id, { title: 'Hack' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── publishAnnouncement ──────────────────────────────────────────────────

  describe('publishAnnouncement', () => {
    it('should publish immediately when no publishAt provided', async () => {
      const result = await service.publishAnnouncement(mockAdmin, mockAnnouncement.id, {});
      expect(result.status).toBe(AnnouncementStatus.PUBLISHED);
      expect(notificationsService.send).toHaveBeenCalled();
      expect(queue.add).not.toHaveBeenCalled();
    });

    it('should schedule a BullMQ delayed job when publishAt is future', async () => {
      const futureDate = new Date(Date.now() + 3_600_000).toISOString();
      const result = await service.publishAnnouncement(mockAdmin, mockAnnouncement.id, {
        publishAt: futureDate,
      });
      expect(result.status).toBe(AnnouncementStatus.SCHEDULED);
      expect(queue.add).toHaveBeenCalledWith(
        'publish-announcement',
        expect.objectContaining({ announcementId: mockAnnouncement.id }),
        expect.objectContaining({ delay: expect.any(Number), jobId: `publish-${mockAnnouncement.id}` }),
      );
    });

    it('should throw BadRequest when announcement is already published', async () => {
      announcementsRepo.findOne.mockResolvedValueOnce({
        ...mockAnnouncement,
        status: AnnouncementStatus.PUBLISHED,
      });
      await expect(
        service.publishAnnouncement(mockAdmin, mockAnnouncement.id, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequest when announcement is archived', async () => {
      announcementsRepo.findOne.mockResolvedValueOnce({
        ...mockAnnouncement,
        status: AnnouncementStatus.ARCHIVED,
      });
      await expect(
        service.publishAnnouncement(mockAdmin, mockAnnouncement.id, {}),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── findById ─────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('should return announcement with isRead=false for unread user', async () => {
      announcementsRepo.findOne.mockResolvedValueOnce({
        ...mockAnnouncement,
        status: AnnouncementStatus.PUBLISHED,
      });
      readsRepo.findOne.mockResolvedValueOnce(null);
      const result = await service.findById(mockAdmin, mockAnnouncement.id);
      expect(result.isRead).toBe(false);
    });

    it('should return isRead=true when read record exists', async () => {
      announcementsRepo.findOne.mockResolvedValueOnce({
        ...mockAnnouncement,
        status: AnnouncementStatus.PUBLISHED,
      });
      readsRepo.findOne.mockResolvedValueOnce({ id: 'read-1', readAt: new Date() });
      const result = await service.findById(mockAdmin, mockAnnouncement.id);
      expect(result.isRead).toBe(true);
    });

    it('should throw NotFoundException when resident requests a draft', async () => {
      // draft is returned by repo but resident should not see it
      await expect(
        service.findById(mockResident, mockAnnouncement.id),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── archiveAnnouncement ─────────────────────────────────────────────────

  describe('archiveAnnouncement', () => {
    it('should archive a published announcement', async () => {
      announcementsRepo.findOne.mockResolvedValueOnce({
        ...mockAnnouncement,
        status: AnnouncementStatus.PUBLISHED,
      });
      const result = await service.archiveAnnouncement(mockAdmin, mockAnnouncement.id);
      expect(result.status).toBe(AnnouncementStatus.ARCHIVED);
    });

    it('should cancel BullMQ job when archiving a scheduled announcement', async () => {
      const removeMock = jest.fn();
      queue.getJob.mockResolvedValueOnce({ remove: removeMock });
      announcementsRepo.findOne.mockResolvedValueOnce({
        ...mockAnnouncement,
        status: AnnouncementStatus.SCHEDULED,
      });
      await service.archiveAnnouncement(mockAdmin, mockAnnouncement.id);
      expect(removeMock).toHaveBeenCalled();
    });

    it('should throw BadRequest when already archived', async () => {
      announcementsRepo.findOne.mockResolvedValueOnce({
        ...mockAnnouncement,
        status: AnnouncementStatus.ARCHIVED,
      });
      await expect(
        service.archiveAnnouncement(mockAdmin, mockAnnouncement.id),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── markAsRead ───────────────────────────────────────────────────────────

  describe('markAsRead', () => {
    it('should mark a published announcement as read (idempotent)', async () => {
      announcementsRepo.findOne.mockResolvedValueOnce({
        ...mockAnnouncement,
        status: AnnouncementStatus.PUBLISHED,
      });
      const result = await service.markAsRead(mockAdmin, mockAnnouncement.id);
      expect(result.success).toBe(true);
    });

    it('should throw BadRequest when marking a draft as read', async () => {
      await expect(
        service.markAsRead(mockAdmin, mockAnnouncement.id),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── togglePin ────────────────────────────────────────────────────────────

  describe('togglePin', () => {
    it('should toggle isPinned from false to true', async () => {
      announcementsRepo.save.mockImplementationOnce(entity => Promise.resolve(entity));
      const result = await service.togglePin(mockAdmin, mockAnnouncement.id);
      expect(result.isPinned).toBe(true);
    });
  });

  // ─── getUnreadCount ───────────────────────────────────────────────────────

  describe('getUnreadCount', () => {
    it('should return unread count for the current user', async () => {
      const result = await service.getUnreadCount(mockResident);
      expect(result).toHaveProperty('unreadCount');
      expect(typeof result.unreadCount).toBe('number');
    });
  });
});
