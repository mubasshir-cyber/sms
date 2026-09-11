import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import { Complaint } from './entities/complaint.entity';
import { ComplaintComment } from './entities/complaint-comment.entity';
import { SlaConfig } from './entities/sla-config.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { ComplaintCategory, ComplaintPriority, ComplaintStatus } from '../../common/enums/complaint.enum';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

describe('ComplaintsService', () => {
  let service: ComplaintsService;

  const mockComplaintsRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockCommentsRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockSlaRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockNotificationsService = {
    send: jest.fn(),
  };

  const residentUser: AuthUser = {
    sub: 'res-1',
    email: 'resident@soc.com',
    role: Role.RESIDENT,
    societyId: 'soc-123',
    unitId: 'unit-101',
    iat: 0,
    exp: 0,
  };

  const adminUser: AuthUser = {
    sub: 'admin-1',
    email: 'admin@soc.com',
    role: Role.SOCIETY_ADMIN,
    societyId: 'soc-123',
    iat: 0,
    exp: 0,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComplaintsService,
        { provide: getRepositoryToken(Complaint), useValue: mockComplaintsRepo },
        { provide: getRepositoryToken(ComplaintComment), useValue: mockCommentsRepo },
        { provide: getRepositoryToken(SlaConfig), useValue: mockSlaRepo },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<ComplaintsService>(ComplaintsService);
  });

  describe('create', () => {
    it('should create complaint for resident linked to unit (happy path)', async () => {
      const mockComplaint = {
        id: 'comp-1',
        title: 'Broken pipe',
        societyId: 'soc-123',
        status: ComplaintStatus.OPEN,
      };
      mockComplaintsRepo.create.mockReturnValue(mockComplaint);
      mockComplaintsRepo.save.mockResolvedValue(mockComplaint);

      const dto = {
        title: 'Broken pipe',
        description: 'Water leaking into kitchen',
        category: ComplaintCategory.PLUMBING,
        priority: ComplaintPriority.HIGH,
      };

      const result = await service.create(residentUser, dto as any);

      expect(result.id).toBe('comp-1');
      expect(mockComplaintsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          unitId: 'unit-101',
          residentId: 'res-1',
          societyId: 'soc-123',
        }),
      );
    });

    it('should throw BadRequestException if resident is not linked to any unit', async () => {
      const unlinkedUser = { ...residentUser, unitId: null };

      const dto = {
        title: 'Broken pipe',
        description: 'Water leaking',
        category: ComplaintCategory.PLUMBING,
      };

      await expect(service.create(unlinkedUser as any, dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateStatus & status workflow', () => {
    it('should allow valid forward status transition (OPEN -> ASSIGNED)', async () => {
      const mockComplaint = {
        id: 'comp-1',
        societyId: 'soc-123',
        status: ComplaintStatus.OPEN,
      };
      mockComplaintsRepo.findOne.mockResolvedValueOnce(mockComplaint);
      mockComplaintsRepo.save.mockImplementation(async (c) => c);

      const updated = await service.updateStatus(adminUser, 'comp-1', {
        status: ComplaintStatus.ASSIGNED,
      });

      expect(updated.status).toBe(ComplaintStatus.ASSIGNED);
    });

    it('should reject invalid status transition (e.g. CLOSED -> OPEN)', async () => {
      const mockComplaint = {
        id: 'comp-1',
        societyId: 'soc-123',
        status: ComplaintStatus.CLOSED,
      };
      mockComplaintsRepo.findOne.mockResolvedValueOnce(mockComplaint);

      await expect(
        service.updateStatus(adminUser, 'comp-1', { status: ComplaintStatus.OPEN }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('addComment (Child Resource Ownership)', () => {
    it('should verify complaint belongs to society before adding comment', async () => {
      mockComplaintsRepo.findOne.mockResolvedValueOnce(null); // complaint not in society

      await expect(
        service.addComment(residentUser, 'comp-foreign', { comment: 'Any update?' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
