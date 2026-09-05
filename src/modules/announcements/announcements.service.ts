import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Queue } from 'bullmq';
import sanitizeHtml from 'sanitize-html';
import { Announcement } from './entities/announcement.entity';
import { AnnouncementRead } from './entities/announcement-read.entity';
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  PublishAnnouncementDto,
  AnnouncementQueryDto,
} from './dto/announcements.dto';
import {
  AnnouncementStatus,
} from '../../common/enums/announcement.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationChannel } from '../../common/enums/notification.enum';
import { Role } from '../../common/enums/role.enum';

/** Allowed HTML tags for announcement body (security-rules.md §6) */
const SAFE_HTML_TAGS = ['p', 'b', 'i', 'strong', 'em', 'ul', 'ol', 'li', 'br', 'h2', 'h3', 'a', 'span'];
const SAFE_HTML_ATTRS: sanitizeHtml.IOptions['allowedAttributes'] = {
  a: ['href', 'target'],
  span: ['style'],
};

const PUBLISHER_ROLES = [
  Role.SUPER_ADMIN,
  Role.SOCIETY_ADMIN,
  Role.COMMITTEE_MEMBER,
  Role.FACILITY_MANAGER,
];

@Injectable()
export class AnnouncementsService {
  private readonly logger = new Logger(AnnouncementsService.name);

  /** Set by AnnouncementsModule after queue is initialized */
  private announcementsQueue: Queue | null = null;

  constructor(
    @InjectRepository(Announcement)
    private readonly announcementsRepo: Repository<Announcement>,
    @InjectRepository(AnnouncementRead)
    private readonly readsRepo: Repository<AnnouncementRead>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** Called from AnnouncementsModule.onModuleInit() after queue is ready */
  setQueue(queue: Queue): void {
    this.announcementsQueue = queue;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ✍️  CREATE / UPDATE / DELETE
  // ═══════════════════════════════════════════════════════════════════════════

  async createAnnouncement(user: AuthUser, dto: CreateAnnouncementDto): Promise<Announcement> {
    const societyId = user.societyId as string;

    const announcement = this.announcementsRepo.create({
      societyId,
      title: dto.title,
      body: sanitizeHtml(dto.body, { allowedTags: SAFE_HTML_TAGS, allowedAttributes: SAFE_HTML_ATTRS }),
      type: dto.type ?? undefined,
      attachmentUrls: dto.attachmentUrls ?? null,
      targetScope: dto.targetScope ?? undefined,
      targetTowerId: dto.targetTowerId ?? null,
      targetFloorId: dto.targetFloorId ?? null,
      targetUnitId: dto.targetUnitId ?? null,
      targetRole: dto.targetRole ?? null,
      isPinned: dto.isPinned ?? false,
      priority: dto.priority ?? undefined,
      status: AnnouncementStatus.DRAFT,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      createdByUserId: user.sub,
    });

    return this.announcementsRepo.save(announcement);
  }

  async updateAnnouncement(
    user: AuthUser,
    id: string,
    dto: UpdateAnnouncementDto,
  ): Promise<Announcement> {
    const announcement = await this.findRaw(user.societyId as string, id);

    if (announcement.status === AnnouncementStatus.PUBLISHED) {
      throw new BadRequestException('Published announcements cannot be edited. Archive it first.');
    }

    // Ensure only the author or an admin can edit a draft
    const isAdmin = [Role.SUPER_ADMIN, Role.SOCIETY_ADMIN].includes(user.role as Role);
    if (!isAdmin && announcement.createdByUserId !== user.sub) {
      throw new ForbiddenException('Only the author or an admin can edit this announcement');
    }

    if (dto.body) {
      dto.body = sanitizeHtml(dto.body, { allowedTags: SAFE_HTML_TAGS, allowedAttributes: SAFE_HTML_ATTRS });
    }

    Object.assign(announcement, dto);
    if (dto.expiresAt) announcement.expiresAt = new Date(dto.expiresAt);

    return this.announcementsRepo.save(announcement);
  }

  async deleteAnnouncement(user: AuthUser, id: string): Promise<{ success: boolean }> {
    const announcement = await this.findRaw(user.societyId as string, id);
    await this.announcementsRepo.softRemove(announcement);
    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📢  PUBLISH
  // ═══════════════════════════════════════════════════════════════════════════

  async publishAnnouncement(
    user: AuthUser,
    id: string,
    dto: PublishAnnouncementDto,
  ): Promise<Announcement> {
    const societyId = user.societyId as string;
    const announcement = await this.findRaw(societyId, id);

    if (announcement.status === AnnouncementStatus.PUBLISHED) {
      throw new BadRequestException('Announcement is already published');
    }
    if (announcement.status === AnnouncementStatus.ARCHIVED) {
      throw new BadRequestException('Archived announcements cannot be published');
    }

    const now = new Date();
    const publishAt = dto.publishAt ? new Date(dto.publishAt) : null;

    if (publishAt && publishAt > now) {
      // ── Scheduled publish ──
      const delayMs = publishAt.getTime() - now.getTime();

      announcement.status = AnnouncementStatus.SCHEDULED;
      announcement.publishAt = publishAt;
      await this.announcementsRepo.save(announcement);

      if (this.announcementsQueue) {
        await this.announcementsQueue.add(
          'publish-announcement',
          { announcementId: id, societyId },
          {
            delay: delayMs,
            jobId: `publish-${id}`, // idempotent — prevents duplicate jobs
            removeOnComplete: true,
            removeOnFail: false,
          },
        );
      }

      this.logger.log(`Announcement ${id} scheduled for ${publishAt.toISOString()}`);
    } else {
      // ── Immediate publish ──
      announcement.status = AnnouncementStatus.PUBLISHED;
      announcement.publishedAt = now;
      announcement.publishAt = null;
      await this.announcementsRepo.save(announcement);

      // Fire notification
      try {
        await this.notificationsService.send({
          userId: announcement.createdByUserId,
          societyId,
          type: NotificationType.ANNOUNCEMENT_PUBLISHED,
          channel: NotificationChannel.IN_APP,
          subject: `📢 ${announcement.title}`,
          body: announcement.body.replace(/<[^>]+>/g, '').slice(0, 200),
          payload: { announcementId: id, type: announcement.type, priority: announcement.priority },
        });
      } catch (err) {
        this.logger.warn(`Notification failed for announcement ${id}:`, err);
      }
    }

    return announcement;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📋  QUERY / FEED
  // ═══════════════════════════════════════════════════════════════════════════

  async findAnnouncements(
    user: AuthUser,
    query: AnnouncementQueryDto,
  ): Promise<{ data: Announcement[]; total: number; page: number; limit: number; totalPages: number }> {
    const societyId = user.societyId as string;
    const isAdmin = PUBLISHER_ROLES.includes(user.role as Role);

    const qb = this.announcementsRepo.createQueryBuilder('a')
      .where('a.society_id = :societyId', { societyId });

    // Residents only see published announcements
    if (!isAdmin) {
      qb.andWhere('a.status = :published', { published: AnnouncementStatus.PUBLISHED });
    } else if (query.status) {
      qb.andWhere('a.status = :status', { status: query.status });
    }

    if (query.type) qb.andWhere('a.type = :type', { type: query.type });
    if (query.priority) qb.andWhere('a.priority = :priority', { priority: query.priority });
    if (query.isPinned !== undefined) qb.andWhere('a.is_pinned = :isPinned', { isPinned: query.isPinned });
    if (query.towerId) qb.andWhere('a.target_tower_id = :towerId', { towerId: query.towerId });
    if (query.search) qb.andWhere('a.title ILIKE :search', { search: `%${query.search}%` });

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    // Pinned first, then by publishedAt or createdAt DESC
    qb.orderBy('a.is_pinned', 'DESC')
      .addOrderBy('COALESCE(a.published_at, a.created_at)', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(user: AuthUser, id: string): Promise<Announcement & { isRead: boolean }> {
    const societyId = user.societyId as string;
    const announcement = await this.findRaw(societyId, id);

    // Residents cannot see non-published announcements
    const isAdmin = PUBLISHER_ROLES.includes(user.role as Role);
    if (!isAdmin && announcement.status !== AnnouncementStatus.PUBLISHED) {
      throw new NotFoundException(`Announcement with ID '${id}' not found`);
    }

    const readRecord = await this.readsRepo.findOne({
      where: { announcementId: id, userId: user.sub },
    });

    return { ...announcement, isRead: !!readRecord };
  }

  async archiveAnnouncement(user: AuthUser, id: string): Promise<Announcement> {
    const announcement = await this.findRaw(user.societyId as string, id);

    if (announcement.status === AnnouncementStatus.ARCHIVED) {
      throw new BadRequestException('Announcement is already archived');
    }

    // Cancel scheduled BullMQ job if pending
    if (announcement.status === AnnouncementStatus.SCHEDULED && this.announcementsQueue) {
      try {
        const job = await this.announcementsQueue.getJob(`publish-${id}`);
        if (job) await job.remove();
      } catch (err) {
        this.logger.warn(`Could not remove scheduled job for announcement ${id}:`, err);
      }
    }

    announcement.status = AnnouncementStatus.ARCHIVED;
    return this.announcementsRepo.save(announcement);
  }

  async togglePin(user: AuthUser, id: string): Promise<Announcement> {
    const announcement = await this.findRaw(user.societyId as string, id);
    announcement.isPinned = !announcement.isPinned;
    return this.announcementsRepo.save(announcement);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 👁️  READ TRACKING
  // ═══════════════════════════════════════════════════════════════════════════

  async markAsRead(user: AuthUser, id: string): Promise<{ success: boolean }> {
    const societyId = user.societyId as string;
    const announcement = await this.findRaw(societyId, id);

    if (announcement.status !== AnnouncementStatus.PUBLISHED) {
      throw new BadRequestException('Cannot mark an unpublished announcement as read');
    }

    // Upsert — idempotent; unique constraint on (announcement_id, user_id)
    await this.readsRepo
      .createQueryBuilder()
      .insert()
      .into(AnnouncementRead)
      .values({
        societyId,
        announcementId: id,
        userId: user.sub,
        readAt: new Date(),
      })
      .orIgnore() // ON CONFLICT DO NOTHING
      .execute();

    return { success: true };
  }

  async getReadReceipt(
    user: AuthUser,
    id: string,
  ): Promise<{ readCount: number; unreadCount: number; readers: { userId: string; readAt: Date }[] }> {
    const societyId = user.societyId as string;
    await this.findRaw(societyId, id);

    const readers = await this.readsRepo.find({
      where: { announcementId: id, societyId },
      select: ['userId', 'readAt'],
      order: { readAt: 'ASC' },
    });

    return {
      readCount: readers.length,
      unreadCount: -1, // Requires joining residents count — placeholder; implement as needed
      readers: readers.map(r => ({ userId: r.userId, readAt: r.readAt })),
    };
  }

  async getUnreadCount(user: AuthUser): Promise<{ unreadCount: number }> {
    const societyId = user.societyId as string;

    // Count published announcements not yet read by this user
    const unreadCount = await this.announcementsRepo
      .createQueryBuilder('a')
      .where('a.society_id = :societyId AND a.status = :status', {
        societyId,
        status: AnnouncementStatus.PUBLISHED,
      })
      .andWhere(
        `NOT EXISTS (
          SELECT 1 FROM announcement_reads ar
          WHERE ar.announcement_id = a.id AND ar.user_id = :userId
        )`,
        { userId: user.sub },
      )
      .getCount();

    return { unreadCount };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔒  PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  private async findRaw(societyId: string, id: string): Promise<Announcement> {
    const announcement = await this.announcementsRepo.findOne({ where: { id, societyId } });
    if (!announcement) throw new NotFoundException(`Announcement with ID '${id}' not found`);
    return announcement;
  }
}
