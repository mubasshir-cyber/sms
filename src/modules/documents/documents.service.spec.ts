import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { SocietyDocument } from './entities/society-document.entity';
import { DocumentAccessLog } from './entities/document-access-log.entity';
import { NotificationsService } from '../notifications/notifications.service';
import {
  DocumentCategory,
  DocumentAccessLevel,
  DocumentStatus,
  DocumentAction,
  DocumentOwnerType,
} from '../../common/enums/document.enum';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

describe('DocumentsService', () => {
  let service: DocumentsService;

  const mockDocsRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    softRemove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockLogsRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockNotificationsService = {
    send: jest.fn(),
  };

  const adminUser: AuthUser = {
    sub: 'admin-1',
    email: 'admin@society.com',
    role: Role.SOCIETY_ADMIN,
    societyId: 'soc-100',
    iat: 0,
    exp: 0,
  };

  const residentUser: AuthUser = {
    sub: 'resident-1',
    email: 'resident@society.com',
    role: Role.RESIDENT,
    societyId: 'soc-100',
    iat: 0,
    exp: 0,
  };

  const mockDoc: Partial<SocietyDocument> = {
    id: 'doc-1',
    societyId: 'soc-100',
    category: DocumentCategory.SOCIETY,
    title: 'Society Registration Certificate',
    description: null,
    fileUrl: 'https://storage.example.com/reg-cert.pdf',
    fileName: 'reg-cert.pdf',
    fileSizeBytes: 204800,
    mimeType: 'application/pdf',
    tags: ['registration', 'certificate'],
    ownerType: null,
    ownerId: null,
    expiryDate: new Date('2027-12-31'),
    lastExpiryAlertSentAt: null,
    isPinned: false,
    version: 1,
    parentDocumentId: null,
    accessLevel: DocumentAccessLevel.ADMIN_ONLY,
    uploadedByUserId: 'admin-1',
    status: DocumentStatus.ACTIVE,
    accessLogs: [],
  };

  const buildQb = (results: unknown[] = [mockDoc]) => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(results),
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: getRepositoryToken(SocietyDocument), useValue: mockDocsRepo },
        { provide: getRepositoryToken(DocumentAccessLog), useValue: mockLogsRepo },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // getSocietyId guard
  // ═══════════════════════════════════════════════════════════════════════════
  describe('getSocietyId', () => {
    it('should throw ForbiddenException when user has no societyId and is not SUPER_ADMIN', async () => {
      const noSocietyUser: AuthUser = { ...adminUser, societyId: undefined, role: Role.RESIDENT };
      mockDocsRepo.create.mockReturnValue({});
      mockDocsRepo.save.mockResolvedValue(mockDoc);

      await expect(
        service.uploadDocument(noSocietyUser, {
          category: DocumentCategory.SOCIETY,
          title: 'Test',
          fileUrl: 'https://example.com/file.pdf',
          fileName: 'file.pdf',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // uploadDocument
  // ═══════════════════════════════════════════════════════════════════════════
  describe('uploadDocument', () => {
    it('should create and return a document', async () => {
      mockDocsRepo.create.mockReturnValue(mockDoc);
      mockDocsRepo.save.mockResolvedValue(mockDoc);

      const result = await service.uploadDocument(adminUser, {
        category: DocumentCategory.SOCIETY,
        title: 'Society Registration Certificate',
        fileUrl: 'https://storage.example.com/reg-cert.pdf',
        fileName: 'reg-cert.pdf',
        fileSizeBytes: 204800,
        mimeType: 'application/pdf',
      });

      expect(result).toEqual(mockDoc);
      expect(mockDocsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          societyId: 'soc-100',
          uploadedByUserId: 'admin-1',
          version: 1,
          parentDocumentId: null,
        }),
      );
    });

    it('should default accessLevel to ADMIN_ONLY', async () => {
      mockDocsRepo.create.mockReturnValue(mockDoc);
      mockDocsRepo.save.mockResolvedValue(mockDoc);

      await service.uploadDocument(adminUser, {
        category: DocumentCategory.FINANCE,
        title: 'Budget 2026',
        fileUrl: 'https://example.com/budget.pdf',
        fileName: 'budget.pdf',
      });

      expect(mockDocsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ accessLevel: DocumentAccessLevel.ADMIN_ONLY }),
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // findAllDocuments
  // ═══════════════════════════════════════════════════════════════════════════
  describe('findAllDocuments', () => {
    it('should return documents for admin without access restriction', async () => {
      const qb = buildQb();
      mockDocsRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAllDocuments(adminUser, {});
      expect(result).toHaveLength(1);
    });

    it('should restrict residents to ALL_RESIDENTS documents', async () => {
      const qb = buildQb([]);
      mockDocsRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findAllDocuments(residentUser, {});
      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('access_level'),
        expect.objectContaining({ ar: DocumentAccessLevel.ALL_RESIDENTS }),
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // findDocumentById
  // ═══════════════════════════════════════════════════════════════════════════
  describe('findDocumentById', () => {
    it('should return document when admin accesses ADMIN_ONLY doc', async () => {
      mockDocsRepo.findOne.mockResolvedValue(mockDoc);
      const result = await service.findDocumentById(adminUser, 'doc-1');
      expect(result).toEqual(mockDoc);
    });

    it('should throw NotFoundException when document not found', async () => {
      mockDocsRepo.findOne.mockResolvedValue(null);
      await expect(service.findDocumentById(adminUser, 'bad-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when resident accesses ADMIN_ONLY doc', async () => {
      mockDocsRepo.findOne.mockResolvedValue({ ...mockDoc, accessLevel: DocumentAccessLevel.ADMIN_ONLY });
      await expect(service.findDocumentById(residentUser, 'doc-1')).rejects.toThrow(ForbiddenException);
    });

    it('should allow resident to access ALL_RESIDENTS document', async () => {
      const publicDoc = { ...mockDoc, accessLevel: DocumentAccessLevel.ALL_RESIDENTS };
      mockDocsRepo.findOne.mockResolvedValue(publicDoc);
      const result = await service.findDocumentById(residentUser, 'doc-1');
      expect(result.accessLevel).toBe(DocumentAccessLevel.ALL_RESIDENTS);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // updateDocument
  // ═══════════════════════════════════════════════════════════════════════════
  describe('updateDocument', () => {
    it('should update document fields for admin', async () => {
      mockDocsRepo.findOne.mockResolvedValue({ ...mockDoc, accessLogs: [] });
      mockDocsRepo.save.mockResolvedValue({ ...mockDoc, title: 'Updated Title' });

      const result = await service.updateDocument(adminUser, 'doc-1', { title: 'Updated Title' });
      expect(result.title).toBe('Updated Title');
    });

    it('should allow uploader to update their own document', async () => {
      const uploaderUser: AuthUser = { ...residentUser, sub: 'admin-1' };
      mockDocsRepo.findOne.mockResolvedValue({ ...mockDoc, accessLevel: DocumentAccessLevel.ALL_RESIDENTS, accessLogs: [] });
      mockDocsRepo.save.mockResolvedValue({ ...mockDoc });

      await expect(
        service.updateDocument(uploaderUser, 'doc-1', { title: 'My Update' }),
      ).resolves.toBeDefined();
    });

    it('should throw ForbiddenException when non-owner resident tries to update', async () => {
      const otherResident: AuthUser = { ...residentUser, sub: 'other-resident' };
      mockDocsRepo.findOne.mockResolvedValue({
        ...mockDoc,
        accessLevel: DocumentAccessLevel.ALL_RESIDENTS,
        uploadedByUserId: 'admin-1',
        accessLogs: [],
      });

      await expect(
        service.updateDocument(otherResident, 'doc-1', { title: 'Hack' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // uploadNewVersion
  // ═══════════════════════════════════════════════════════════════════════════
  describe('uploadNewVersion', () => {
    it('should create new version and archive parent', async () => {
      const parentDoc = { ...mockDoc, version: 1, accessLogs: [] };
      mockDocsRepo.findOne.mockResolvedValue(parentDoc);
      mockDocsRepo.save.mockResolvedValue({ ...mockDoc, version: 2, parentDocumentId: 'doc-1' });
      mockDocsRepo.create.mockReturnValue({ version: 2 });
      mockLogsRepo.create.mockReturnValue({ action: DocumentAction.VERSION_UPLOADED });
      mockLogsRepo.save.mockResolvedValue({ id: 'log-1' });

      const result = await service.uploadNewVersion(adminUser, 'doc-1', {
        fileUrl: 'https://storage.example.com/reg-cert-v2.pdf',
        fileName: 'reg-cert-v2.pdf',
      });

      // Parent should be archived
      expect(mockDocsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: DocumentStatus.ARCHIVED }),
      );
    });

    it('should throw BadRequestException when parent is already archived', async () => {
      mockDocsRepo.findOne.mockResolvedValue({
        ...mockDoc,
        status: DocumentStatus.ARCHIVED,
        accessLogs: [],
      });

      await expect(
        service.uploadNewVersion(adminUser, 'doc-1', {
          fileUrl: 'https://example.com/v2.pdf',
          fileName: 'v2.pdf',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // archiveDocument
  // ═══════════════════════════════════════════════════════════════════════════
  describe('archiveDocument', () => {
    it('should archive an active document', async () => {
      mockDocsRepo.findOne.mockResolvedValue({ ...mockDoc, accessLogs: [] });
      mockDocsRepo.save.mockResolvedValue({ ...mockDoc, status: DocumentStatus.ARCHIVED });

      const result = await service.archiveDocument(adminUser, 'doc-1');
      expect(result.status).toBe(DocumentStatus.ARCHIVED);
    });

    it('should throw BadRequestException if already archived', async () => {
      mockDocsRepo.findOne.mockResolvedValue({
        ...mockDoc,
        status: DocumentStatus.ARCHIVED,
        accessLogs: [],
      });

      await expect(service.archiveDocument(adminUser, 'doc-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException for non-admin roles', async () => {
      mockDocsRepo.findOne.mockResolvedValue({ ...mockDoc, accessLevel: DocumentAccessLevel.ALL_RESIDENTS, accessLogs: [] });

      await expect(service.archiveDocument(residentUser, 'doc-1')).rejects.toThrow(ForbiddenException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // deleteDocument
  // ═══════════════════════════════════════════════════════════════════════════
  describe('deleteDocument', () => {
    it('should soft-delete document and log the action', async () => {
      mockDocsRepo.findOne.mockResolvedValue({ ...mockDoc, accessLogs: [] });
      mockDocsRepo.softRemove.mockResolvedValue({});
      mockLogsRepo.create.mockReturnValue({ action: DocumentAction.DELETED });
      mockLogsRepo.save.mockResolvedValue({ id: 'log-2' });

      await service.deleteDocument(adminUser, 'doc-1');
      expect(mockDocsRepo.softRemove).toHaveBeenCalled();
      expect(mockLogsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: DocumentAction.DELETED }),
      );
    });

    it('should throw ForbiddenException for committee member', async () => {
      const committeeUser: AuthUser = { ...adminUser, role: Role.COMMITTEE_MEMBER };
      mockDocsRepo.findOne.mockResolvedValue({ ...mockDoc, accessLogs: [] });

      await expect(service.deleteDocument(committeeUser, 'doc-1')).rejects.toThrow(ForbiddenException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // searchDocuments
  // ═══════════════════════════════════════════════════════════════════════════
  describe('searchDocuments', () => {
    it('should return search results', async () => {
      const qb = buildQb([mockDoc]);
      mockDocsRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.searchDocuments(adminUser, 'registration');
      expect(result).toHaveLength(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // getExpiringDocuments
  // ═══════════════════════════════════════════════════════════════════════════
  describe('getExpiringDocuments', () => {
    it('should return expiring documents within 30 days', async () => {
      const qb = buildQb([mockDoc]);
      mockDocsRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getExpiringDocuments(adminUser);
      expect(result).toHaveLength(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // logAccess
  // ═══════════════════════════════════════════════════════════════════════════
  describe('logAccess', () => {
    it('should create an access log entry', async () => {
      mockDocsRepo.findOne.mockResolvedValue({ ...mockDoc, accessLogs: [] });
      const mockLog = { id: 'log-1', action: DocumentAction.VIEWED };
      mockLogsRepo.create.mockReturnValue(mockLog);
      mockLogsRepo.save.mockResolvedValue(mockLog);

      const result = await service.logAccess(adminUser, 'doc-1', {
        action: DocumentAction.VIEWED,
        ipAddress: '192.168.1.1',
      });

      expect(result.action).toBe(DocumentAction.VIEWED);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // getAccessLogs
  // ═══════════════════════════════════════════════════════════════════════════
  describe('getAccessLogs', () => {
    it('should return logs for admin', async () => {
      mockLogsRepo.find.mockResolvedValue([{ id: 'log-1', action: DocumentAction.VIEWED }]);

      const result = await service.getAccessLogs(adminUser, 'doc-1');
      expect(result).toHaveLength(1);
    });

    it('should throw ForbiddenException for resident', async () => {
      await expect(service.getAccessLogs(residentUser, 'doc-1')).rejects.toThrow(ForbiddenException);
    });
  });
});
