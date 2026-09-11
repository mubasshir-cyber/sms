import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import {
  DocumentCategory,
  DocumentAccessLevel,
  DocumentStatus,
  DocumentAction,
} from '../../common/enums/document.enum';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

describe('DocumentsController', () => {
  let controller: DocumentsController;

  const mockDocumentsService = {
    uploadDocument: jest.fn(),
    findAllDocuments: jest.fn(),
    findDocumentById: jest.fn(),
    updateDocument: jest.fn(),
    uploadNewVersion: jest.fn(),
    getVersionHistory: jest.fn(),
    archiveDocument: jest.fn(),
    deleteDocument: jest.fn(),
    searchDocuments: jest.fn(),
    getExpiringDocuments: jest.fn(),
    logAccess: jest.fn(),
    getAccessLogs: jest.fn(),
  };

  const adminUser: AuthUser = {
    sub: 'admin-1',
    email: 'admin@society.com',
    role: Role.SOCIETY_ADMIN,
    societyId: 'soc-100',
    iat: 0,
    exp: 0,
  };

  const mockDoc = {
    id: 'doc-1',
    societyId: 'soc-100',
    category: DocumentCategory.SOCIETY,
    title: 'Society Registration Certificate',
    fileUrl: 'https://storage.example.com/reg-cert.pdf',
    fileName: 'reg-cert.pdf',
    version: 1,
    status: DocumentStatus.ACTIVE,
    accessLevel: DocumentAccessLevel.ADMIN_ONLY,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        { provide: DocumentsService, useValue: mockDocumentsService },
      ],
    }).compile();

    controller = module.get<DocumentsController>(DocumentsController);
  });

  describe('uploadDocument', () => {
    it('should call service and return created document', async () => {
      mockDocumentsService.uploadDocument.mockResolvedValue(mockDoc);

      const dto = {
        category: DocumentCategory.SOCIETY,
        title: 'Society Registration Certificate',
        fileUrl: 'https://storage.example.com/reg-cert.pdf',
        fileName: 'reg-cert.pdf',
      };
      const result = await controller.uploadDocument(adminUser, dto);

      expect(result).toEqual(mockDoc);
      expect(mockDocumentsService.uploadDocument).toHaveBeenCalledWith(adminUser, dto);
    });
  });

  describe('findAllDocuments', () => {
    it('should return list of documents', async () => {
      mockDocumentsService.findAllDocuments.mockResolvedValue([mockDoc]);

      const result = await controller.findAllDocuments(adminUser, {});
      expect(result).toHaveLength(1);
      expect(mockDocumentsService.findAllDocuments).toHaveBeenCalledWith(adminUser, {});
    });

    it('should pass category filter', async () => {
      mockDocumentsService.findAllDocuments.mockResolvedValue([mockDoc]);
      const filter = { category: DocumentCategory.FINANCE };

      await controller.findAllDocuments(adminUser, filter);
      expect(mockDocumentsService.findAllDocuments).toHaveBeenCalledWith(adminUser, filter);
    });
  });

  describe('searchDocuments', () => {
    it('should return search results', async () => {
      mockDocumentsService.searchDocuments.mockResolvedValue([mockDoc]);

      const result = await controller.searchDocuments(adminUser, { q: 'registration' });
      expect(result).toHaveLength(1);
      expect(mockDocumentsService.searchDocuments).toHaveBeenCalledWith(adminUser, 'registration');
    });
  });

  describe('getExpiringDocuments', () => {
    it('should return expiring documents', async () => {
      mockDocumentsService.getExpiringDocuments.mockResolvedValue([mockDoc]);

      const result = await controller.getExpiringDocuments(adminUser);
      expect(result).toHaveLength(1);
    });
  });

  describe('findDocumentById', () => {
    it('should return document by id', async () => {
      mockDocumentsService.findDocumentById.mockResolvedValue(mockDoc);

      const result = await controller.findDocumentById(adminUser, 'doc-1');
      expect(result).toEqual(mockDoc);
      expect(mockDocumentsService.findDocumentById).toHaveBeenCalledWith(adminUser, 'doc-1');
    });
  });

  describe('updateDocument', () => {
    it('should update and return document', async () => {
      const updated = { ...mockDoc, title: 'Updated Title', isPinned: true };
      mockDocumentsService.updateDocument.mockResolvedValue(updated);

      const result = await controller.updateDocument(adminUser, 'doc-1', { title: 'Updated Title', isPinned: true });
      expect(result.title).toBe('Updated Title');
    });
  });

  describe('uploadNewVersion', () => {
    it('should upload new version', async () => {
      const v2 = { ...mockDoc, version: 2, parentDocumentId: 'doc-1' };
      mockDocumentsService.uploadNewVersion.mockResolvedValue(v2);

      const result = await controller.uploadNewVersion(adminUser, 'doc-1', {
        fileUrl: 'https://example.com/v2.pdf',
        fileName: 'reg-cert-v2.pdf',
      });
      expect(result.version).toBe(2);
    });
  });

  describe('getVersionHistory', () => {
    it('should return version history', async () => {
      const history = [mockDoc, { ...mockDoc, id: 'doc-2', version: 2 }];
      mockDocumentsService.getVersionHistory.mockResolvedValue(history);

      const result = await controller.getVersionHistory(adminUser, 'doc-1');
      expect(result).toHaveLength(2);
    });
  });

  describe('archiveDocument', () => {
    it('should archive document', async () => {
      const archived = { ...mockDoc, status: DocumentStatus.ARCHIVED };
      mockDocumentsService.archiveDocument.mockResolvedValue(archived);

      const result = await controller.archiveDocument(adminUser, 'doc-1');
      expect(result.status).toBe(DocumentStatus.ARCHIVED);
    });
  });

  describe('deleteDocument', () => {
    it('should soft-delete document', async () => {
      mockDocumentsService.deleteDocument.mockResolvedValue(undefined);

      await controller.deleteDocument(adminUser, 'doc-1');
      expect(mockDocumentsService.deleteDocument).toHaveBeenCalledWith(adminUser, 'doc-1');
    });
  });

  describe('logAccess', () => {
    it('should log access event', async () => {
      const log = { id: 'log-1', action: DocumentAction.VIEWED };
      mockDocumentsService.logAccess.mockResolvedValue(log);

      const result = await controller.logAccess(adminUser, 'doc-1', {
        action: DocumentAction.VIEWED,
        ipAddress: '10.0.0.1',
      });
      expect(result.action).toBe(DocumentAction.VIEWED);
    });
  });

  describe('getAccessLogs', () => {
    it('should return access logs', async () => {
      const logs = [{ id: 'log-1', action: DocumentAction.VIEWED }];
      mockDocumentsService.getAccessLogs.mockResolvedValue(logs);

      const result = await controller.getAccessLogs(adminUser, 'doc-1');
      expect(result).toHaveLength(1);
    });
  });
});
