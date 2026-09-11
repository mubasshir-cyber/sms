import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual, IsNull } from 'typeorm';
import { Gate } from './entities/gate.entity';
import { GateAssignment } from './entities/gate-assignment.entity';
import { Visitor } from './entities/visitor.entity';
import { VisitorLog } from './entities/visitor-log.entity';
import { SecurityIncident } from './entities/security-incident.entity';
import {
  CreateGateDto,
  UpdateGateDto,
  AssignGuardDto,
} from './dto/gates.dto';
import {
  InviteVisitorDto,
  WalkInVisitorDto,
  CheckInVisitorDto,
  CheckOutVisitorDto,
  BlacklistVisitorDto,
  VisitorQueryDto,
} from './dto/visitors.dto';
import {
  CreateIncidentDto,
  ResolveIncidentDto,
} from './dto/incidents.dto';
import {
  VisitorStatus,
  IncidentStatus,
  IncidentSeverity,
} from '../../common/enums/visitor.enum';
import { Role, RESIDENT_ROLES, ADMIN_ROLES } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationChannel } from '../../common/enums/notification.enum';

@Injectable()
export class VisitorsService {
  private readonly logger = new Logger(VisitorsService.name);

  constructor(
    @InjectRepository(Gate)
    private readonly gatesRepo: Repository<Gate>,
    @InjectRepository(GateAssignment)
    private readonly assignmentsRepo: Repository<GateAssignment>,
    @InjectRepository(Visitor)
    private readonly visitorsRepo: Repository<Visitor>,
    @InjectRepository(VisitorLog)
    private readonly logsRepo: Repository<VisitorLog>,
    @InjectRepository(SecurityIncident)
    private readonly incidentsRepo: Repository<SecurityIncident>,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // 🚪 GATES MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  async createGate(user: AuthUser, dto: CreateGateDto): Promise<Gate> {
    const gate = this.gatesRepo.create({
      societyId: user.societyId as string,
      name: dto.name,
      gateType: dto.gateType,
      locationDescription: dto.locationDescription,
      isActive: dto.isActive ?? true,
    });
    return this.gatesRepo.save(gate);
  }

  async findGates(user: AuthUser): Promise<Gate[]> {
    return this.gatesRepo.find({
      where: { societyId: user.societyId as string },
      order: { name: 'ASC' },
    });
  }

  async findGateById(user: AuthUser, id: string): Promise<Gate> {
    const gate = await this.gatesRepo.findOne({
      where: { id, societyId: user.societyId as string },
    });
    if (!gate) throw new NotFoundException(`Gate with ID '${id}' not found`);
    return gate;
  }

  async updateGate(user: AuthUser, id: string, dto: UpdateGateDto): Promise<Gate> {
    const gate = await this.findGateById(user, id);
    Object.assign(gate, dto);
    return this.gatesRepo.save(gate);
  }

  async deleteGate(user: AuthUser, id: string): Promise<{ success: boolean }> {
    const gate = await this.findGateById(user, id);
    await this.gatesRepo.softRemove(gate);
    return { success: true };
  }

  async assignGuard(user: AuthUser, gateId: string, dto: AssignGuardDto): Promise<GateAssignment> {
    await this.findGateById(user, gateId);

    const assignment = this.assignmentsRepo.create({
      societyId: user.societyId as string,
      gateId,
      guardUserId: dto.guardUserId,
      shiftName: dto.shiftName,
      shiftStart: new Date(dto.shiftStart),
      shiftEnd: new Date(dto.shiftEnd),
      notes: dto.notes,
    });
    return this.assignmentsRepo.save(assignment);
  }

  async findGateAssignments(user: AuthUser, gateId: string): Promise<GateAssignment[]> {
    await this.findGateById(user, gateId);
    return this.assignmentsRepo.find({
      where: { societyId: user.societyId as string, gateId },
      order: { shiftStart: 'DESC' },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 👥 VISITOR INVITATIONS & ENTRIES
  // ═══════════════════════════════════════════════════════════════════════════

  private generatePasscode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateQrToken(): string {
    return `QR-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  async inviteVisitor(user: AuthUser, dto: InviteVisitorDto): Promise<Visitor> {
    const validFrom = new Date(dto.validFrom);
    const validUntil = new Date(dto.validUntil);

    if (validUntil <= validFrom) {
      throw new BadRequestException('validUntil must be after validFrom');
    }

    const unitId = RESIDENT_ROLES.includes(user.role as Role)
      ? (user.unitId ?? dto.unitId)
      : dto.unitId;

    const passcode = this.generatePasscode();
    const qrCodeData = this.generateQrToken();

    const visitor = this.visitorsRepo.create({
      societyId: user.societyId as string,
      unitId,
      hostUserId: user.sub,
      name: dto.name,
      phone: dto.phone,
      visitorType: dto.visitorType,
      purpose: dto.purpose,
      vehicleNumber: dto.vehicleNumber,
      passcode,
      qrCodeData,
      status: VisitorStatus.PRE_APPROVED,
      validFrom,
      validUntil,
      isFrequent: dto.isFrequent ?? false,
    });

    return this.visitorsRepo.save(visitor);
  }

  async walkInVisitor(user: AuthUser, dto: WalkInVisitorDto): Promise<{ visitor: Visitor; log: VisitorLog }> {
    const gate = await this.findGateById(user, dto.gateId);

    // Check if blacklisted
    const blacklisted = await this.visitorsRepo.findOne({
      where: { societyId: user.societyId as string, phone: dto.phone, isBlacklisted: true },
    });

    if (blacklisted) {
      throw new BadRequestException(`This visitor phone (${dto.phone}) is blacklisted: ${blacklisted.blacklistReason}`);
    }

    const now = new Date();
    const validUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h validity for walk-in

    const visitor = this.visitorsRepo.create({
      societyId: user.societyId as string,
      unitId: dto.unitId,
      hostUserId: user.sub,
      name: dto.name,
      phone: dto.phone,
      visitorType: dto.visitorType,
      purpose: dto.purpose,
      vehicleNumber: dto.vehicleNumber,
      photoUrl: dto.photoUrl,
      status: VisitorStatus.CHECKED_IN,
      validFrom: now,
      validUntil,
    });

    const savedVisitor = await this.visitorsRepo.save(visitor);

    const log = this.logsRepo.create({
      societyId: user.societyId as string,
      visitorId: savedVisitor.id,
      entryGateId: gate.id,
      checkedInByUserId: user.sub,
      checkedInAt: now,
      vehicleNumber: dto.vehicleNumber,
      photoUrl: dto.photoUrl,
      notes: dto.notes,
    });

    const savedLog = await this.logsRepo.save(log);

    // Notify host resident
    try {
      await this.notificationsService.send({
        societyId: user.societyId as string,
        userId: visitor.hostUserId,
        type: NotificationType.GENERAL,
        channel: NotificationChannel.IN_APP,
        subject: `Visitor Arrived: ${savedVisitor.name}`,
        body: `${savedVisitor.name} (${savedVisitor.visitorType}) has checked in at ${gate.name}.`,
        payload: { visitorId: savedVisitor.id, gateId: gate.id },
      });
    } catch (err) {
      this.logger.warn(`Failed to dispatch visitor arrival notification: ${err}`);
    }

    return { visitor: savedVisitor, log: savedLog };
  }

  async findVisitors(user: AuthUser, query: VisitorQueryDto): Promise<Visitor[]> {
    const qb = this.visitorsRepo.createQueryBuilder('v')
      .where('v.societyId = :societyId', { societyId: user.societyId });

    if (RESIDENT_ROLES.includes(user.role as Role)) {
      qb.andWhere('v.unitId = :unitId', { unitId: user.unitId });
    } else if (query.unitId) {
      qb.andWhere('v.unitId = :unitId', { unitId: query.unitId });
    }

    if (query.status) {
      qb.andWhere('v.status = :status', { status: query.status });
    }

    if (query.type) {
      qb.andWhere('v.visitorType = :type', { type: query.type });
    }

    if (query.fromDate) {
      qb.andWhere('v.validFrom >= :fromDate', { fromDate: new Date(query.fromDate) });
    }

    if (query.toDate) {
      qb.andWhere('v.validUntil <= :toDate', { toDate: new Date(query.toDate) });
    }

    return qb.orderBy('v.createdAt', 'DESC').getMany();
  }

  async findMyInvitations(user: AuthUser): Promise<Visitor[]> {
    return this.visitorsRepo.find({
      where: {
        societyId: user.societyId as string,
        hostUserId: user.sub,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async verifyPasscodeOrQr(user: AuthUser, code: string): Promise<Visitor> {
    const visitor = await this.visitorsRepo.findOne({
      where: [
        { societyId: user.societyId as string, passcode: code },
        { societyId: user.societyId as string, qrCodeData: code },
      ],
    });

    if (!visitor) {
      throw new NotFoundException('Invalid or unrecognized entry code / QR token');
    }

    if (visitor.isBlacklisted) {
      throw new BadRequestException(`Visitor is BLACKLISTED: ${visitor.blacklistReason}`);
    }

    const now = new Date();
    if (now > visitor.validUntil) {
      visitor.status = VisitorStatus.EXPIRED;
      await this.visitorsRepo.save(visitor);
      throw new BadRequestException('This visitor pass has EXPIRED');
    }

    return visitor;
  }

  async checkInVisitor(user: AuthUser, visitorId: string, dto: CheckInVisitorDto): Promise<{ visitor: Visitor; log: VisitorLog }> {
    const visitor = await this.visitorsRepo.findOne({
      where: { id: visitorId, societyId: user.societyId as string },
    });

    if (!visitor) throw new NotFoundException('Visitor not found');
    if (visitor.isBlacklisted) throw new BadRequestException(`Visitor is blacklisted: ${visitor.blacklistReason}`);
    if (visitor.status === VisitorStatus.CHECKED_IN) throw new BadRequestException('Visitor is already checked in');

    const gate = await this.findGateById(user, dto.gateId);
    const now = new Date();

    visitor.status = VisitorStatus.CHECKED_IN;
    if (dto.vehicleNumber) visitor.vehicleNumber = dto.vehicleNumber;
    if (dto.photoUrl) visitor.photoUrl = dto.photoUrl;
    const savedVisitor = await this.visitorsRepo.save(visitor);

    const log = this.logsRepo.create({
      societyId: user.societyId as string,
      visitorId: visitor.id,
      entryGateId: gate.id,
      checkedInByUserId: user.sub,
      checkedInAt: now,
      vehicleNumber: dto.vehicleNumber ?? visitor.vehicleNumber,
      photoUrl: dto.photoUrl ?? visitor.photoUrl,
      notes: dto.notes,
    });

    const savedLog = await this.logsRepo.save(log);

    // Notify resident host
    try {
      await this.notificationsService.send({
        societyId: user.societyId as string,
        userId: visitor.hostUserId,
        type: NotificationType.GENERAL,
        channel: NotificationChannel.IN_APP,
        subject: `Visitor Checked In: ${savedVisitor.name}`,
        body: `${savedVisitor.name} has arrived and checked in at ${gate.name}.`,
        payload: { visitorId: savedVisitor.id, gateId: gate.id },
      });
    } catch (err) {
      this.logger.warn(`Failed to dispatch check-in notification: ${err}`);
    }

    return { visitor: savedVisitor, log: savedLog };
  }

  async checkOutVisitor(user: AuthUser, visitorId: string, dto: CheckOutVisitorDto): Promise<{ visitor: Visitor; log: VisitorLog }> {
    const visitor = await this.visitorsRepo.findOne({
      where: { id: visitorId, societyId: user.societyId as string },
    });

    if (!visitor) throw new NotFoundException('Visitor not found');
    if (visitor.status !== VisitorStatus.CHECKED_IN) throw new BadRequestException('Visitor is not currently checked in');

    const gate = await this.findGateById(user, dto.gateId);
    const now = new Date();

    visitor.status = VisitorStatus.CHECKED_OUT;
    const savedVisitor = await this.visitorsRepo.save(visitor);

    // Find latest active log entry without exit timestamp
    const log = await this.logsRepo.findOne({
      where: { visitorId: visitor.id, checkedOutAt: IsNull() },
      order: { checkedInAt: 'DESC' },
    });

    if (log) {
      log.exitGateId = gate.id;
      log.checkedOutByUserId = user.sub;
      log.checkedOutAt = now;
      if (dto.notes) log.notes = `${log.notes ?? ''} | Exit: ${dto.notes}`;
      await this.logsRepo.save(log);
      return { visitor: savedVisitor, log };
    }

    // Fallback if log was not found
    const newLog = this.logsRepo.create({
      societyId: user.societyId as string,
      visitorId: visitor.id,
      entryGateId: gate.id,
      checkedInByUserId: user.sub,
      checkedInAt: now,
      exitGateId: gate.id,
      checkedOutByUserId: user.sub,
      checkedOutAt: now,
      notes: dto.notes,
    });
    const savedLog = await this.logsRepo.save(newLog);

    return { visitor: savedVisitor, log: savedLog };
  }

  async blacklistVisitor(user: AuthUser, visitorId: string, dto: BlacklistVisitorDto): Promise<Visitor> {
    const visitor = await this.visitorsRepo.findOne({
      where: { id: visitorId, societyId: user.societyId as string },
    });
    if (!visitor) throw new NotFoundException('Visitor not found');

    visitor.isBlacklisted = true;
    visitor.blacklistReason = dto.reason;
    visitor.status = VisitorStatus.REJECTED;

    return this.visitorsRepo.save(visitor);
  }

  async getAnalytics(user: AuthUser): Promise<{
    insideNow: number;
    todayEntries: number;
    todayPreApproved: number;
    todayWalkIns: number;
    blacklistedCount: number;
  }> {
    const societyId = user.societyId as string;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const insideNow = await this.visitorsRepo.count({
      where: { societyId, status: VisitorStatus.CHECKED_IN },
    });

    const todayEntries = await this.logsRepo.count({
      where: { societyId, checkedInAt: MoreThanOrEqual(startOfToday) },
    });

    const todayPreApproved = await this.visitorsRepo.count({
      where: {
        societyId,
        createdAt: MoreThanOrEqual(startOfToday),
        passcode: MoreThanOrEqual(''),
      },
    });

    const blacklistedCount = await this.visitorsRepo.count({
      where: { societyId, isBlacklisted: true },
    });

    return {
      insideNow,
      todayEntries,
      todayPreApproved,
      todayWalkIns: Math.max(0, todayEntries - todayPreApproved),
      blacklistedCount,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🚨 SECURITY INCIDENTS & SOS
  // ═══════════════════════════════════════════════════════════════════════════

  async createIncident(user: AuthUser, dto: CreateIncidentDto): Promise<SecurityIncident> {
    const incident = this.incidentsRepo.create({
      societyId: user.societyId as string,
      reportedByUserId: user.sub,
      gateId: dto.gateId,
      incidentType: dto.incidentType,
      severity: dto.severity ?? IncidentSeverity.LOW,
      title: dto.title,
      description: dto.description,
      status: IncidentStatus.REPORTED,
    });

    const saved = await this.incidentsRepo.save(incident);

    // If High/Critical severity or SOS Panic Alert, log warning
    if (incident.severity === IncidentSeverity.CRITICAL || incident.severity === IncidentSeverity.HIGH) {
      this.logger.warn(`🚨 HIGH/CRITICAL SECURITY INCIDENT REPORTED: ${incident.title} in society ${user.societyId}`);
    }

    return saved;
  }

  async findIncidents(user: AuthUser, status?: IncidentStatus): Promise<SecurityIncident[]> {
    const where: any = { societyId: user.societyId as string };
    if (status) where.status = status;

    return this.incidentsRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async resolveIncident(user: AuthUser, incidentId: string, dto: ResolveIncidentDto): Promise<SecurityIncident> {
    const incident = await this.incidentsRepo.findOne({
      where: { id: incidentId, societyId: user.societyId as string },
    });
    if (!incident) throw new NotFoundException('Security incident not found');

    incident.status = dto.status ?? IncidentStatus.RESOLVED;
    incident.resolutionNotes = dto.resolutionNotes;
    incident.resolvedAt = new Date();
    incident.resolvedByUserId = user.sub;

    return this.incidentsRepo.save(incident);
  }
}
