import {
  Injectable, NotFoundException, BadRequestException,
  ForbiddenException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, LessThan } from 'typeorm';
import { Complaint } from './entities/complaint.entity';
import { ComplaintComment } from './entities/complaint-comment.entity';
import { SlaConfig } from './entities/sla-config.entity';
import {
  CreateComplaintDto,
  UpdateComplaintDto,
  AssignComplaintDto,
  UpdateStatusDto,
  AddCommentDto,
  CloseComplaintDto,
  UpsertSlaConfigDto,
  ComplaintQueryDto,
} from './dto/complaints.dto';
import {
  ComplaintStatus,
  ComplaintCategory,
  COMPLAINT_STATUS_TRANSITIONS,
  ACTIVE_COMPLAINT_STATUSES,
} from '../../common/enums/complaint.enum';
import { Role, RESIDENT_ROLES } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationChannel } from '../../common/enums/notification.enum';

@Injectable()
export class ComplaintsService {
  private readonly logger = new Logger(ComplaintsService.name);

  constructor(
    @InjectRepository(Complaint)
    private readonly complaintsRepo: Repository<Complaint>,
    @InjectRepository(ComplaintComment)
    private readonly commentsRepo: Repository<ComplaintComment>,
    @InjectRepository(SlaConfig)
    private readonly slaRepo: Repository<SlaConfig>,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ─── Create ───────────────────────────────────────────────────────────────

  async create(user: AuthUser, dto: CreateComplaintDto): Promise<Complaint> {
    if (!user.unitId && RESIDENT_ROLES.includes(user.role as Role)) {
      throw new BadRequestException('Resident must be linked to a unit to raise a complaint');
    }

    const unitId = user.unitId ?? dto['unitId']; // residents use their own unitId
    const complaint = this.complaintsRepo.create({
      societyId: user.societyId as string,
      unitId: unitId as string,
      residentId: user.sub,
      title: dto.title,
      description: dto.description,
      category: dto.category,
      priority: dto.priority,
      photoUrls: dto.photoUrls ?? [],
      status: ComplaintStatus.OPEN,
    });

    const saved = await this.complaintsRepo.save(complaint);
    this.logger.log(`Complaint created: ${saved.id} by user ${user.sub}`);

    // Notify society admin / facility manager
    await this.notificationsService.send({
      societyId: user.societyId as string,
      userId: user.sub,
      type: NotificationType.COMPLAINT_RAISED,
      channel: NotificationChannel.IN_APP,
      subject: 'New Complaint Raised',
      body: `A new ${dto.priority} priority complaint was raised: "${dto.title}"`,
      payload: { complaintId: saved.id, category: dto.category },
    });

    return saved;
  }

  // ─── Find All (scoped by role) ────────────────────────────────────────────

  async findAll(
    user: AuthUser,
    query: ComplaintQueryDto,
  ): Promise<{ data: Complaint[]; total: number; page: number; limit: number }> {
    const societyId = user.societyId as string;
    const { page = 1, limit = 20, status, priority, category, unitId, assignedToUserId } = query;

    const where: Record<string, unknown> = { societyId };

    // Residents can only see their own unit's complaints
    if (RESIDENT_ROLES.includes(user.role as Role)) {
      where['unitId'] = user.unitId;
    } else {
      if (unitId) where['unitId'] = unitId;
      if (assignedToUserId) where['assignedToUserId'] = assignedToUserId;
    }

    if (status) where['status'] = status;
    if (priority) where['priority'] = priority;
    if (category) where['category'] = category;

    const [data, total] = await this.complaintsRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  // ─── Find One ─────────────────────────────────────────────────────────────

  async findOne(user: AuthUser, id: string): Promise<Complaint> {
    const complaint = await this.complaintsRepo.findOne({
      where: { id, societyId: user.societyId as string },
    });

    if (!complaint) throw new NotFoundException(`Complaint ${id} not found`);

    // Residents can only see their own unit's complaints
    if (RESIDENT_ROLES.includes(user.role as Role) && complaint.unitId !== user.unitId) {
      throw new ForbiddenException('You do not have access to this complaint');
    }

    return complaint;
  }

  // ─── Assign ───────────────────────────────────────────────────────────────

  async assignComplaint(
    user: AuthUser,
    id: string,
    dto: AssignComplaintDto,
  ): Promise<Complaint> {
    const complaint = await this.findOne(user, id);

    if (complaint.status === ComplaintStatus.CLOSED) {
      throw new BadRequestException('Cannot assign a closed complaint');
    }

    // Calculate SLA deadline from config
    const slaConfig = await this.slaRepo.findOne({
      where: { societyId: user.societyId as string, category: complaint.category, isActive: true },
    });

    const slaDeadline = slaConfig
      ? new Date(Date.now() + slaConfig.resolutionHours * 60 * 60 * 1000)
      : null;

    complaint.assignedToUserId = dto.assignedToUserId;
    complaint.status = ComplaintStatus.ASSIGNED;
    complaint.slaDeadline = slaDeadline;

    const saved = await this.complaintsRepo.save(complaint);
    this.logger.log(`Complaint ${id} assigned to user ${dto.assignedToUserId}`);

    // Notify assigned staff
    await this.notificationsService.send({
      societyId: user.societyId as string,
      userId: dto.assignedToUserId,
      type: NotificationType.COMPLAINT_ASSIGNED,
      channel: NotificationChannel.IN_APP,
      subject: 'Complaint Assigned to You',
      body: `You have been assigned complaint: "${complaint.title}"`,
      payload: { complaintId: id },
    });

    return saved;
  }

  // ─── Update Status ────────────────────────────────────────────────────────

  async updateStatus(
    user: AuthUser,
    id: string,
    dto: UpdateStatusDto,
  ): Promise<Complaint> {
    const complaint = await this.findOne(user, id);

    // Validate forward-only transition
    const allowedNext = COMPLAINT_STATUS_TRANSITIONS[complaint.status];
    if (!allowedNext.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from "${complaint.status}" to "${dto.status}". Allowed: ${allowedNext.join(', ') || 'none'}`,
      );
    }

    complaint.status = dto.status;

    if (dto.status === ComplaintStatus.RESOLVED) {
      complaint.resolvedAt = new Date();
    }

    const saved = await this.complaintsRepo.save(complaint);

    // If there's a note, save it as an internal comment
    if (dto.note) {
      await this.commentsRepo.save(
        this.commentsRepo.create({
          complaintId: id,
          userId: user.sub,
          userRole: user.role as Role,
          userName: user.email,
          message: dto.note,
          isInternal: true,
        }),
      );
    }

    // Notify resident of status change
    await this.notificationsService.send({
      societyId: user.societyId as string,
      userId: complaint.residentId,
      type: NotificationType.COMPLAINT_STATUS_UPDATE,
      channel: NotificationChannel.IN_APP,
      subject: 'Complaint Status Updated',
      body: `Your complaint "${complaint.title}" status changed to: ${dto.status.replace('_', ' ')}`,
      payload: { complaintId: id, newStatus: dto.status },
    });

    return saved;
  }

  // ─── Add Comment ──────────────────────────────────────────────────────────

  async addComment(
    user: AuthUser,
    complaintId: string,
    dto: AddCommentDto,
  ): Promise<ComplaintComment> {
    const complaint = await this.findOne(user, complaintId);

    // Residents cannot post internal comments
    const isResident = RESIDENT_ROLES.includes(user.role as Role);
    if (isResident && dto.isInternal) {
      throw new ForbiddenException('Residents cannot post internal comments');
    }

    // Residents cannot comment on closed complaints
    if (isResident && complaint.status === ComplaintStatus.CLOSED) {
      throw new BadRequestException('Cannot comment on a closed complaint');
    }

    const comment = this.commentsRepo.create({
      complaintId,
      userId: user.sub,
      userRole: user.role as Role,
      userName: user.email,
      message: dto.message,
      isInternal: dto.isInternal ?? false,
    });

    return this.commentsRepo.save(comment);
  }

  // ─── Get Comments ─────────────────────────────────────────────────────────

  async getComments(user: AuthUser, complaintId: string): Promise<ComplaintComment[]> {
    await this.findOne(user, complaintId); // scope / existence check

    const isResident = RESIDENT_ROLES.includes(user.role as Role);
    const where: Record<string, unknown> = { complaintId };

    // Residents cannot see internal comments
    if (isResident) {
      where['isInternal'] = false;
    }

    return this.commentsRepo.find({
      where,
      order: { createdAt: 'ASC' },
    });
  }

  // ─── Close (Resident confirms resolution) ─────────────────────────────────

  async closeComplaint(
    user: AuthUser,
    id: string,
    dto: CloseComplaintDto,
  ): Promise<Complaint> {
    const complaint = await this.findOne(user, id);

    // Only the resident who raised it can close
    if (complaint.residentId !== user.sub) {
      throw new ForbiddenException('Only the resident who raised this complaint can close it');
    }

    if (complaint.status !== ComplaintStatus.RESOLVED) {
      throw new BadRequestException(
        `Complaint must be in RESOLVED status to close. Current status: ${complaint.status}`,
      );
    }

    complaint.status = ComplaintStatus.CLOSED;
    complaint.residentRating = dto.rating;
    complaint.residentFeedback = dto.feedback ?? null;
    complaint.closedAt = new Date();

    return this.complaintsRepo.save(complaint);
  }

  // ─── Escalate (Internal — called by SLA job) ──────────────────────────────

  async escalateComplaint(id: string, societyId: string): Promise<void> {
    const complaint = await this.complaintsRepo.findOne({ where: { id, societyId } });
    if (!complaint || complaint.isEscalated) return;

    complaint.status = ComplaintStatus.ESCALATED;
    complaint.isEscalated = true;
    complaint.escalatedAt = new Date();
    await this.complaintsRepo.save(complaint);

    this.logger.warn(`Complaint ${id} auto-escalated due to SLA breach`);

    // Notify society admin about escalation
    await this.notificationsService.send({
      societyId,
      userId: societyId, // broadcast to admin — service handles resolution
      type: NotificationType.COMPLAINT_ESCALATED,
      channel: NotificationChannel.IN_APP,
      subject: '⚠️ Complaint SLA Breached',
      body: `Complaint "${complaint.title}" has been auto-escalated due to SLA breach.`,
      payload: { complaintId: id, category: complaint.category, priority: complaint.priority },
    });
  }

  // ─── Find SLA-breached complaints (called by SLA checker job) ─────────────

  async findSlaBreached(): Promise<Complaint[]> {
    return this.complaintsRepo.find({
      where: {
        status: In(ACTIVE_COMPLAINT_STATUSES),
        isEscalated: false,
        slaDeadline: LessThan(new Date()),
      },
    });
  }

  // ─── Analytics ────────────────────────────────────────────────────────────

  async getAnalytics(societyId: string): Promise<Record<string, unknown>> {
    const all = await this.complaintsRepo.find({ where: { societyId } });

    const byStatus = Object.values(ComplaintStatus).reduce(
      (acc, s) => ({ ...acc, [s]: all.filter(c => c.status === s).length }),
      {} as Record<string, number>,
    );

    const byCategory = Object.values(ComplaintCategory).reduce(
      (acc, cat) => ({ ...acc, [cat]: all.filter(c => c.category === cat).length }),
      {} as Record<string, number>,
    );

    const resolved = all.filter(c => c.resolvedAt && c.createdAt);
    const avgResolutionHours =
      resolved.length > 0
        ? resolved.reduce((sum, c) => {
            const diff = new Date(c.resolvedAt!).getTime() - new Date(c.createdAt).getTime();
            return sum + diff / (1000 * 60 * 60);
          }, 0) / resolved.length
        : 0;

    const openCritical = all.filter(
      c => c.priority === 'critical' && c.status !== ComplaintStatus.CLOSED,
    ).length;

    return {
      total: all.length,
      byStatus,
      byCategory,
      openCritical,
      avgResolutionHours: Math.round(avgResolutionHours * 10) / 10,
      escalated: all.filter(c => c.isEscalated).length,
    };
  }

  // ─── SLA Config CRUD ──────────────────────────────────────────────────────

  async upsertSlaConfig(societyId: string, dto: UpsertSlaConfigDto): Promise<SlaConfig> {
    const existing = await this.slaRepo.findOne({
      where: { societyId, category: dto.category },
    });

    if (existing) {
      Object.assign(existing, {
        resolutionHours: dto.resolutionHours,
        escalationHours: dto.escalationHours,
        isActive: dto.isActive ?? existing.isActive,
      });
      return this.slaRepo.save(existing);
    }

    const config = this.slaRepo.create({ ...dto, societyId });
    return this.slaRepo.save(config);
  }

  async findAllSlaConfigs(societyId: string): Promise<SlaConfig[]> {
    return this.slaRepo.find({ where: { societyId }, order: { category: 'ASC' } });
  }

  // ─── Bulk update (admin only) ─────────────────────────────────────────────

  async update(user: AuthUser, id: string, dto: UpdateComplaintDto): Promise<Complaint> {
    const complaint = await this.findOne(user, id);
    Object.assign(complaint, dto);
    return this.complaintsRepo.save(complaint);
  }
}
