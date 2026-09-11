import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, LessThanOrEqual, IsNull, Not } from 'typeorm';
import { SocietyDocument } from './entities/society-document.entity';
import { DocumentAccessLog } from './entities/document-access-log.entity';
import {
  UploadDocumentDto,
  UpdateDocumentDto,
  UploadDocumentVersionDto,
  DocumentFilterDto,
  LogDocumentAccessDto,
} from './dto/documents.dto';
import {
  DocumentStatus,
  DocumentAccessLevel,
  DocumentAction,
} from '../../common/enums/document.enum';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationChannel } from '../../common/enums/notification.enum';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    @InjectRepository(SocietyDocument)
    private readonly docsRepo: Repository<SocietyDocument>,
    @InjectRepository(DocumentAccessLog)
    private readonly logsRepo: Repository<DocumentAccessLog>,
    private readonly notificationsService: NotificationsService,
  ) {}

  private getSocietyId(user: AuthUser): string {
    if (!user.societyId && user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('User is not associated with any society');
    }
    return user.societyId as string;
  }

  /**
   * Verify that the requesting user is allowed to read a document at the given access level.
   */
  private canRead(user: AuthUser, accessLevel: DocumentAccessLevel): boolean {
    const adminRoles: Role[] = [Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT];
    const committeeRoles: Role[] = [...adminRoles, Role.COMMITTEE_MEMBER, Role.FACILITY_MANAGER];

    switch (accessLevel) {
      case DocumentAccessLevel.ADMIN_ONLY:
        return adminRoles.includes(user.role);
      case DocumentAccessLevel.COMMITTEE:
        return committeeRoles.includes(user.role);
      case DocumentAccessLevel.ALL_RESIDENTS:
        return true; // all authenticated users
      default:
        return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📁 DOCUMENTS
  // ═══════════════════════════════════════════════════════════════════════════

  async uploadDocument(user: AuthUser, dto: UploadDocumentDto): Promise<SocietyDocument> {
    const societyId = this.getSocietyId(user);

    const doc = this.docsRepo.create({
      societyId,
      category: dto.category,
      title: dto.title,
      description: dto.description ?? null,
      fileUrl: dto.fileUrl,
      fileName: dto.fileName,
      fileSizeBytes: dto.fileSizeBytes ?? null,
      mimeType: dto.mimeType ?? null,
      tags: dto.tags ?? null,
      ownerType: dto.ownerType ?? null,
      ownerId: dto.ownerId ?? null,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
      accessLevel: dto.accessLevel ?? DocumentAccessLevel.ADMIN_ONLY,
      uploadedByUserId: user.sub,
      version: 1,
      parentDocumentId: null,
    });

    return this.docsRepo.save(doc);
  }

  async findAllDocuments(user: AuthUser, filter: DocumentFilterDto): Promise<SocietyDocument[]> {
    const societyId = this.getSocietyId(user);

    const qb = this.docsRepo
      .createQueryBuilder('doc')
      .where('doc.society_id = :societyId', { societyId })
      .andWhere('doc.status = :status', { status: DocumentStatus.ACTIVE })
      .andWhere('doc.deleted_at IS NULL');

    if (filter.category) {
      qb.andWhere('doc.category = :category', { category: filter.category });
    }
    if (filter.ownerType) {
      qb.andWhere('doc.owner_type = :ownerType', { ownerType: filter.ownerType });
    }
    if (filter.ownerId) {
      qb.andWhere('doc.owner_id = :ownerId', { ownerId: filter.ownerId });
    }
    if (filter.accessLevel) {
      qb.andWhere('doc.access_level = :accessLevel', { accessLevel: filter.accessLevel });
    }

    // Filter by user's read access
    if (user.role === Role.SUPER_ADMIN || user.role === Role.SOCIETY_ADMIN || user.role === Role.ACCOUNTANT) {
      // no restriction — see everything
    } else if (user.role === Role.COMMITTEE_MEMBER || user.role === Role.FACILITY_MANAGER) {
      qb.andWhere('doc.access_level IN (:...levels)', {
        levels: [DocumentAccessLevel.COMMITTEE, DocumentAccessLevel.ALL_RESIDENTS],
      });
    } else {
      qb.andWhere('doc.access_level = :ar', { ar: DocumentAccessLevel.ALL_RESIDENTS });
    }

    if (filter.pinnedFirst) {
      qb.orderBy('doc.is_pinned', 'DESC').addOrderBy('doc.created_at', 'DESC');
    } else {
      qb.orderBy('doc.created_at', 'DESC');
    }

    return qb.getMany();
  }

  async findDocumentById(user: AuthUser, id: string): Promise<SocietyDocument> {
    const societyId = this.getSocietyId(user);
    const doc = await this.docsRepo.findOne({
      where: { id, societyId },
      relations: ['accessLogs'],
    });

    if (!doc) {
      throw new NotFoundException(`Document ${id} not found`);
    }
    if (!this.canRead(user, doc.accessLevel)) {
      throw new ForbiddenException('You do not have permission to access this document');
    }

    return doc;
  }

  async updateDocument(user: AuthUser, id: string, dto: UpdateDocumentDto): Promise<SocietyDocument> {
    const doc = await this.findDocumentById(user, id);

    // Only admin roles can update documents they don't own
    const canEdit =
      [Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.COMMITTEE_MEMBER, Role.FACILITY_MANAGER, Role.ACCOUNTANT].includes(user.role) ||
      doc.uploadedByUserId === user.sub;

    if (!canEdit) {
      throw new ForbiddenException('You can only edit documents you uploaded');
    }

    Object.assign(doc, {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.tags !== undefined && { tags: dto.tags }),
      ...(dto.accessLevel !== undefined && { accessLevel: dto.accessLevel }),
      ...(dto.expiryDate !== undefined && {
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
      }),
      ...(dto.isPinned !== undefined && { isPinned: dto.isPinned }),
    });

    return this.docsRepo.save(doc);
  }

  async uploadNewVersion(
    user: AuthUser,
    parentId: string,
    dto: UploadDocumentVersionDto,
  ): Promise<SocietyDocument> {
    const parent = await this.findDocumentById(user, parentId);

    if (parent.status === DocumentStatus.ARCHIVED) {
      throw new BadRequestException('Cannot add a version to an archived document');
    }

    // Archive the current version
    parent.status = DocumentStatus.ARCHIVED;
    await this.docsRepo.save(parent);

    // Create the new version
    const newVersion = this.docsRepo.create({
      societyId: parent.societyId,
      category: parent.category,
      title: parent.title,
      description: dto.description ?? parent.description,
      fileUrl: dto.fileUrl,
      fileName: dto.fileName,
      fileSizeBytes: dto.fileSizeBytes ?? null,
      mimeType: dto.mimeType ?? null,
      tags: parent.tags,
      ownerType: parent.ownerType,
      ownerId: parent.ownerId,
      expiryDate: parent.expiryDate,
      accessLevel: parent.accessLevel,
      uploadedByUserId: user.sub,
      version: parent.version + 1,
      parentDocumentId: parent.id,
      isPinned: parent.isPinned,
    });

    // Log version upload on the parent
    await this.internalLogAccess(parent.societyId, parent.id, user.sub, DocumentAction.VERSION_UPLOADED);

    return this.docsRepo.save(newVersion);
  }

  async archiveDocument(user: AuthUser, id: string): Promise<SocietyDocument> {
    const doc = await this.findDocumentById(user, id);

    if (!([Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.COMMITTEE_MEMBER] as Role[]).includes(user.role)) {
      throw new ForbiddenException('Only admins and committee members can archive documents');
    }

    if (doc.status === DocumentStatus.ARCHIVED) {
      throw new BadRequestException('Document is already archived');
    }

    doc.status = DocumentStatus.ARCHIVED;
    return this.docsRepo.save(doc);
  }

  async deleteDocument(user: AuthUser, id: string): Promise<void> {
    const doc = await this.findDocumentById(user, id);

    if (!([Role.SUPER_ADMIN, Role.SOCIETY_ADMIN] as Role[]).includes(user.role)) {
      throw new ForbiddenException('Only society admins can delete documents');
    }

    // Log deletion before soft-delete
    await this.internalLogAccess(doc.societyId, doc.id, user.sub, DocumentAction.DELETED);

    await this.docsRepo.softRemove(doc);
  }

  async getVersionHistory(user: AuthUser, id: string): Promise<SocietyDocument[]> {
    const doc = await this.findDocumentById(user, id);
    const societyId = this.getSocietyId(user);

    // Walk the chain: find all docs that share the same root
    // We collect by traversing parent_document_id chain upward, then finding all descendants
    const rootId = await this.findRootDocumentId(doc.id, societyId);

    return this.docsRepo
      .createQueryBuilder('doc')
      .where('doc.society_id = :societyId', { societyId })
      .andWhere(
        '(doc.id = :rootId OR doc.parent_document_id = :rootId OR doc.id IN ' +
          '(SELECT id FROM society_documents WHERE parent_document_id IN ' +
          '(SELECT id FROM society_documents WHERE parent_document_id = :rootId)))',
        { rootId },
      )
      .andWhere('doc.deleted_at IS NULL')
      .orderBy('doc.version', 'ASC')
      .getMany();
  }

  private async findRootDocumentId(docId: string, societyId: string): Promise<string> {
    let current = await this.docsRepo.findOne({ where: { id: docId, societyId } });
    while (current?.parentDocumentId) {
      const parent = await this.docsRepo.findOne({
        where: { id: current.parentDocumentId, societyId },
      });
      if (!parent) break;
      current = parent;
    }
    return current?.id ?? docId;
  }

  async searchDocuments(user: AuthUser, q: string): Promise<SocietyDocument[]> {
    const societyId = this.getSocietyId(user);

    const qb = this.docsRepo
      .createQueryBuilder('doc')
      .where('doc.society_id = :societyId', { societyId })
      .andWhere('doc.status = :status', { status: DocumentStatus.ACTIVE })
      .andWhere('doc.deleted_at IS NULL')
      .andWhere(
        '(doc.title ILIKE :q OR doc.description ILIKE :q OR doc.tags::text ILIKE :q)',
        { q: `%${q}%` },
      );

    // Access filter
    if (user.role === Role.COMMITTEE_MEMBER || user.role === Role.FACILITY_MANAGER) {
      qb.andWhere('doc.access_level IN (:...levels)', {
        levels: [DocumentAccessLevel.COMMITTEE, DocumentAccessLevel.ALL_RESIDENTS],
      });
    } else if (![Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT].includes(user.role)) {
      qb.andWhere('doc.access_level = :ar', { ar: DocumentAccessLevel.ALL_RESIDENTS });
    }

    return qb.orderBy('doc.created_at', 'DESC').getMany();
  }

  async getExpiringDocuments(user: AuthUser): Promise<SocietyDocument[]> {
    const societyId = this.getSocietyId(user);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    return this.docsRepo
      .createQueryBuilder('doc')
      .where('doc.society_id = :societyId', { societyId })
      .andWhere('doc.status = :status', { status: DocumentStatus.ACTIVE })
      .andWhere('doc.deleted_at IS NULL')
      .andWhere('doc.expiry_date IS NOT NULL')
      .andWhere('doc.expiry_date <= :target', { target: thirtyDaysLater })
      .orderBy('doc.expiry_date', 'ASC')
      .getMany();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📋 ACCESS LOGS
  // ═══════════════════════════════════════════════════════════════════════════

  async logAccess(
    user: AuthUser,
    documentId: string,
    dto: LogDocumentAccessDto,
  ): Promise<DocumentAccessLog> {
    // Verify the document exists and user can access it
    const doc = await this.findDocumentById(user, documentId);
    return this.internalLogAccess(doc.societyId, doc.id, user.sub, dto.action, dto.ipAddress);
  }

  private async internalLogAccess(
    societyId: string,
    documentId: string,
    userId: string,
    action: DocumentAction,
    ipAddress?: string,
  ): Promise<DocumentAccessLog> {
    const log = this.logsRepo.create({
      societyId,
      documentId,
      userId,
      action,
      ipAddress: ipAddress ?? null,
      accessedAt: new Date(),
    });
    return this.logsRepo.save(log);
  }

  async getAccessLogs(user: AuthUser, documentId: string): Promise<DocumentAccessLog[]> {
    // Only admins can view access logs
    if (!([Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.COMMITTEE_MEMBER] as Role[]).includes(user.role)) {
      throw new ForbiddenException('Only admins can view document access logs');
    }

    const societyId = this.getSocietyId(user);
    return this.logsRepo.find({
      where: { societyId, documentId },
      order: { accessedAt: 'DESC' },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔔 SCHEDULER HELPER
  // ═══════════════════════════════════════════════════════════════════════════

  async checkExpiryAlerts(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const alertDays = [30, 15, 7];

    for (const days of alertDays) {
      const target = new Date(today);
      target.setDate(target.getDate() + days);
      const nextDay = new Date(target);
      nextDay.setDate(nextDay.getDate() + 1);

      const docs = await this.docsRepo
        .createQueryBuilder('doc')
        .where('doc.expiry_date >= :target', { target })
        .andWhere('doc.expiry_date < :nextDay', { nextDay })
        .andWhere('doc.status = :status', { status: DocumentStatus.ACTIVE })
        .andWhere('doc.deleted_at IS NULL')
        .andWhere(
          '(doc.last_expiry_alert_sent_at IS NULL OR doc.last_expiry_alert_sent_at < :cutoff)',
          { cutoff: today },
        )
        .getMany();

      for (const doc of docs) {
        try {
          await this.notificationsService.send({
            userId: 'broadcast-admin',
            societyId: doc.societyId,
            type: NotificationType.GENERAL,
            channel: NotificationChannel.IN_APP,
            subject: `⚠️ Document Expiring in ${days} Days`,
            body: `Document "${doc.title}" (${doc.category}) expires on ${doc.expiryDate?.toISOString().split('T')[0]}. Please renew or update.`,
          });
          doc.lastExpiryAlertSentAt = new Date();
          await this.docsRepo.save(doc);
        } catch (err) {
          this.logger.error(`Failed to send expiry alert for document ${doc.id}`, err);
        }
      }
    }
  }
}
