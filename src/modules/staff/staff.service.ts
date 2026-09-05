import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual } from 'typeorm';
import { StaffMember } from './entities/staff-member.entity';
import { StaffAttendance } from './entities/staff-attendance.entity';
import { StaffShift } from './entities/staff-shift.entity';
import { StaffLeave } from './entities/staff-leave.entity';
import { StaffTask } from './entities/staff-task.entity';
import {
  CreateStaffMemberDto,
  UpdateStaffMemberDto,
  ExitStaffMemberDto,
  StaffQueryDto,
  RecordAttendanceDto,
  RecordBulkAttendanceDto,
  CreateStaffShiftDto,
  UpdateStaffShiftDto,
  ApplyLeaveDto,
  ProcessLeaveDto,
  LeaveQueryDto,
  AttendanceQueryDto,
  CreateTaskDto,
  CompleteTaskDto,
} from './dto/staff.dto';
import {
  StaffStatus,
  AttendanceStatus,
  LeaveStatus,
} from '../../common/enums/staff.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationChannel } from '../../common/enums/notification.enum';

@Injectable()
export class StaffService {
  private readonly logger = new Logger(StaffService.name);

  constructor(
    @InjectRepository(StaffMember)
    private readonly staffRepo: Repository<StaffMember>,
    @InjectRepository(StaffAttendance)
    private readonly attendanceRepo: Repository<StaffAttendance>,
    @InjectRepository(StaffShift)
    private readonly shiftsRepo: Repository<StaffShift>,
    @InjectRepository(StaffLeave)
    private readonly leavesRepo: Repository<StaffLeave>,
    @InjectRepository(StaffTask)
    private readonly tasksRepo: Repository<StaffTask>,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ─── Staff Code Generator ──────────────────────────────────────────────────
  private async generateStaffCode(societyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.staffRepo.count({ where: { societyId } });
    const seq = String(count + 1).padStart(4, '0');
    return `STF-${year}-${seq}`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 👤 STAFF PROFILE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  async createStaffMember(user: AuthUser, dto: CreateStaffMemberDto): Promise<StaffMember> {
    const societyId = user.societyId as string;
    const staffCode = await this.generateStaffCode(societyId);

    const staff = this.staffRepo.create({
      societyId,
      staffCode,
      staffType: dto.staffType,
      status: StaffStatus.ACTIVE,
      name: dto.name,
      phone: dto.phone,
      email: dto.email ?? null,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
      address: dto.address ?? null,
      photoUrl: dto.photoUrl ?? null,
      aadhaarNumber: dto.aadhaarNumber ?? null, // In production: encrypt before storing
      panNumber: dto.panNumber ?? null,
      monthlyWage: dto.monthlyWage ?? null,
      defaultShift: dto.defaultShift ?? undefined,
      joinDate: dto.joinDate ? new Date(dto.joinDate) : null,
      isDomesticHelp: dto.isDomesticHelp ?? false,
      policeVerificationUrl: dto.policeVerificationUrl ?? null,
      aadhaarDocUrl: dto.aadhaarDocUrl ?? null,
      idProofDocUrl: dto.idProofDocUrl ?? null,
      notes: dto.notes ?? null,
    });

    return this.staffRepo.save(staff);
  }

  async findStaffMembers(
    user: AuthUser,
    query: StaffQueryDto,
  ): Promise<{ data: StaffMember[]; total: number; page: number; limit: number; totalPages: number }> {
    const societyId = user.societyId as string;
    const qb = this.staffRepo.createQueryBuilder('s')
      .where('s.society_id = :societyId', { societyId });

    if (query.staffType) {
      qb.andWhere('s.staff_type = :staffType', { staffType: query.staffType });
    }
    if (query.status) {
      qb.andWhere('s.status = :status', { status: query.status });
    }
    if (query.defaultShift) {
      qb.andWhere('s.default_shift = :defaultShift', { defaultShift: query.defaultShift });
    }
    if (query.isDomesticHelp !== undefined) {
      qb.andWhere('s.is_domestic_help = :isDomesticHelp', { isDomesticHelp: query.isDomesticHelp });
    }
    if (query.search) {
      qb.andWhere(
        '(s.name ILIKE :search OR s.phone ILIKE :search OR s.staff_code ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    qb.orderBy('s.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    // Mask Aadhaar for all responses (Security Rule 5.1)
    data.forEach(s => {
      if (s.aadhaarNumber) {
        s.aadhaarNumber = `XXXX-XXXX-${s.aadhaarNumber.slice(-4)}`;
      }
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findStaffMemberById(user: AuthUser, id: string): Promise<StaffMember> {
    const staff = await this.staffRepo.findOne({
      where: { id, societyId: user.societyId as string },
    });
    if (!staff) throw new NotFoundException(`Staff member with ID '${id}' not found`);

    // Mask Aadhaar
    if (staff.aadhaarNumber) {
      staff.aadhaarNumber = `XXXX-XXXX-${staff.aadhaarNumber.slice(-4)}`;
    }
    return staff;
  }

  async updateStaffMember(user: AuthUser, id: string, dto: UpdateStaffMemberDto): Promise<StaffMember> {
    const staff = await this.findRawStaffMember(user.societyId as string, id);
    Object.assign(staff, dto);
    return this.staffRepo.save(staff);
  }

  async exitStaffMember(user: AuthUser, id: string, dto: ExitStaffMemberDto): Promise<StaffMember> {
    const staff = await this.findRawStaffMember(user.societyId as string, id);

    if ([StaffStatus.RESIGNED, StaffStatus.TERMINATED].includes(staff.status)) {
      throw new BadRequestException(`Staff member is already in '${staff.status}' status`);
    }

    staff.exitDate = new Date(dto.exitDate);
    staff.exitReason = dto.exitReason;
    staff.status = dto.finalStatus ?? StaffStatus.RESIGNED;

    return this.staffRepo.save(staff);
  }

  async deleteStaffMember(user: AuthUser, id: string): Promise<{ success: boolean }> {
    const staff = await this.findRawStaffMember(user.societyId as string, id);
    await this.staffRepo.softRemove(staff);
    return { success: true };
  }

  private async findRawStaffMember(societyId: string, id: string): Promise<StaffMember> {
    const staff = await this.staffRepo.findOne({ where: { id, societyId } });
    if (!staff) throw new NotFoundException(`Staff member with ID '${id}' not found`);
    return staff;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📅 ATTENDANCE TRACKING
  // ═══════════════════════════════════════════════════════════════════════════

  async recordAttendance(
    user: AuthUser,
    staffId: string,
    dto: RecordAttendanceDto,
  ): Promise<StaffAttendance> {
    const societyId = user.societyId as string;
    await this.findRawStaffMember(societyId, staffId);

    // Prevent duplicate attendance for the same date
    const existing = await this.attendanceRepo.findOne({
      where: { societyId, staffId, date: dto.date },
    });
    if (existing) {
      throw new ConflictException(`Attendance for staff '${staffId}' on '${dto.date}' already recorded`);
    }

    const attendance = this.attendanceRepo.create({
      societyId,
      staffId,
      date: dto.date,
      status: dto.status,
      checkinTime: dto.checkinTime ?? null,
      checkoutTime: dto.checkoutTime ?? null,
      gateId: dto.gateId ?? null,
      markedByUserId: user.sub,
      notes: dto.notes ?? null,
    });

    return this.attendanceRepo.save(attendance);
  }

  async recordBulkAttendance(
    user: AuthUser,
    dto: RecordBulkAttendanceDto,
  ): Promise<{ created: number; skipped: number }> {
    const societyId = user.societyId as string;
    let created = 0;
    let skipped = 0;

    for (const record of dto.records) {
      const existing = await this.attendanceRepo.findOne({
        where: { societyId, staffId: record.staffId, date: dto.date },
      });

      if (existing) {
        skipped++;
        continue;
      }

      const attendance = this.attendanceRepo.create({
        societyId,
        staffId: record.staffId,
        date: dto.date,
        status: record.status,
        checkinTime: record.checkinTime ?? null,
        checkoutTime: record.checkoutTime ?? null,
        gateId: dto.gateId ?? null,
        markedByUserId: user.sub,
        notes: record.notes ?? null,
      });

      await this.attendanceRepo.save(attendance);
      created++;
    }

    return { created, skipped };
  }

  async getStaffAttendance(
    user: AuthUser,
    staffId: string,
    query: AttendanceQueryDto,
  ): Promise<StaffAttendance[]> {
    const societyId = user.societyId as string;
    await this.findRawStaffMember(societyId, staffId);

    const qb = this.attendanceRepo.createQueryBuilder('a')
      .where('a.society_id = :societyId AND a.staff_id = :staffId', { societyId, staffId });

    if (query.startDate && query.endDate) {
      qb.andWhere('a.date BETWEEN :startDate AND :endDate', {
        startDate: query.startDate,
        endDate: query.endDate,
      });
    }
    if (query.status) {
      qb.andWhere('a.status = :status', { status: query.status });
    }

    return qb.orderBy('a.date', 'DESC').getMany();
  }

  async getSocietyAttendanceReport(
    user: AuthUser,
    query: AttendanceQueryDto,
  ): Promise<{ date: string; present: number; absent: number; halfDay: number; onLeave: number }[]> {
    const societyId = user.societyId as string;

    const raw = await this.attendanceRepo
      .createQueryBuilder('a')
      .select('a.date', 'date')
      .addSelect(`COUNT(CASE WHEN a.status = 'present' THEN 1 END)`, 'present')
      .addSelect(`COUNT(CASE WHEN a.status = 'absent' THEN 1 END)`, 'absent')
      .addSelect(`COUNT(CASE WHEN a.status = 'half_day' THEN 1 END)`, 'halfDay')
      .addSelect(`COUNT(CASE WHEN a.status = 'on_leave' THEN 1 END)`, 'onLeave')
      .where('a.society_id = :societyId', { societyId })
      .andWhere(
        query.startDate && query.endDate
          ? 'a.date BETWEEN :startDate AND :endDate'
          : '1=1',
        { startDate: query.startDate, endDate: query.endDate },
      )
      .groupBy('a.date')
      .orderBy('a.date', 'DESC')
      .getRawMany();

    return raw.map(r => ({
      date: r.date,
      present: parseInt(r.present ?? '0', 10),
      absent: parseInt(r.absent ?? '0', 10),
      halfDay: parseInt(r.halfDay ?? '0', 10),
      onLeave: parseInt(r.onLeave ?? '0', 10),
    }));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🕐 SHIFT MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  async createShift(user: AuthUser, staffId: string, dto: CreateStaffShiftDto): Promise<StaffShift> {
    const societyId = user.societyId as string;
    await this.findRawStaffMember(societyId, staffId);

    const shift = this.shiftsRepo.create({
      societyId,
      staffId,
      shiftType: dto.shiftType,
      startTime: dto.startTime,
      endTime: dto.endTime,
      effectiveFrom: dto.effectiveFrom ?? null,
      effectiveTo: dto.effectiveTo ?? null,
      isActive: true,
      notes: dto.notes ?? null,
    });

    return this.shiftsRepo.save(shift);
  }

  async findShifts(user: AuthUser, staffId: string): Promise<StaffShift[]> {
    const societyId = user.societyId as string;
    await this.findRawStaffMember(societyId, staffId);

    return this.shiftsRepo.find({
      where: { societyId, staffId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateShift(
    user: AuthUser,
    staffId: string,
    shiftId: string,
    dto: UpdateStaffShiftDto,
  ): Promise<StaffShift> {
    const societyId = user.societyId as string;
    const shift = await this.shiftsRepo.findOne({
      where: { id: shiftId, staffId, societyId },
    });
    if (!shift) throw new NotFoundException(`Shift with ID '${shiftId}' not found`);

    Object.assign(shift, dto);
    return this.shiftsRepo.save(shift);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏖️ LEAVE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  async applyLeave(user: AuthUser, staffId: string, dto: ApplyLeaveDto): Promise<StaffLeave> {
    const societyId = user.societyId as string;
    const staff = await this.findRawStaffMember(societyId, staffId);

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (endDate < startDate) {
      throw new BadRequestException('endDate must be on or after startDate');
    }

    const diffMs = endDate.getTime() - startDate.getTime();
    const totalDays = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;

    const leave = this.leavesRepo.create({
      societyId,
      staffId,
      leaveType: dto.leaveType,
      startDate: dto.startDate,
      endDate: dto.endDate,
      totalDays,
      reason: dto.reason,
      status: LeaveStatus.PENDING,
      appliedByUserId: user.sub,
    });

    const saved = await this.leavesRepo.save(leave);

    // Notify Facility Manager / Society Admin
    this.logger.log(`Leave applied for staff ${staffId} (${staff.name}): ${dto.startDate} – ${dto.endDate}`);

    try {
      await this.notificationsService.send({
        userId: user.sub, // Back-notify for confirmation
        societyId,
        type: NotificationType.LEAVE_REQUEST,
        channel: NotificationChannel.IN_APP,
        subject: `📋 Leave request submitted for ${staff.name}`,
        body: `A ${dto.leaveType} leave has been applied for ${staff.name} from ${dto.startDate} to ${dto.endDate} (${totalDays} day(s)). Pending approval.`,
        payload: { leaveId: saved.id, staffId, staffName: staff.name },
      });
    } catch (err) {
      this.logger.warn(`Leave notification failed for staff ${staffId}:`, err);
    }

    return saved;
  }

  async processLeave(user: AuthUser, leaveId: string, dto: ProcessLeaveDto): Promise<StaffLeave> {
    const societyId = user.societyId as string;
    const leave = await this.leavesRepo.findOne({ where: { id: leaveId, societyId } });
    if (!leave) throw new NotFoundException(`Leave with ID '${leaveId}' not found`);

    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(`Leave is already '${leave.status}'. Only pending leaves can be processed.`);
    }

    leave.status = dto.status;
    leave.approvedByUserId = user.sub;
    leave.approvedAt = new Date();

    if (dto.status === LeaveStatus.REJECTED && dto.rejectionReason) {
      leave.rejectionReason = dto.rejectionReason;
    }

    const updated = await this.leavesRepo.save(leave);

    // Notify the manager who applied the leave
    const staff = await this.staffRepo.findOne({ where: { id: leave.staffId } });
    const notifType = dto.status === LeaveStatus.APPROVED
      ? NotificationType.LEAVE_APPROVED
      : NotificationType.LEAVE_REJECTED;
    const emoji = dto.status === LeaveStatus.APPROVED ? '✅' : '❌';

    try {
      await this.notificationsService.send({
        userId: leave.appliedByUserId,
        societyId,
        type: notifType,
        channel: NotificationChannel.IN_APP,
        subject: `${emoji} Leave ${dto.status} for ${staff?.name ?? leave.staffId}`,
        body:
          dto.status === LeaveStatus.APPROVED
            ? `Leave from ${leave.startDate} to ${leave.endDate} has been approved.`
            : `Leave from ${leave.startDate} to ${leave.endDate} was rejected. Reason: ${dto.rejectionReason ?? 'Not specified'}`,
        payload: { leaveId, staffId: leave.staffId },
      });
    } catch (err) {
      this.logger.warn(`Leave process notification failed:`, err);
    }

    return updated;
  }

  async findLeaves(
    user: AuthUser,
    staffId: string,
    query: LeaveQueryDto,
  ): Promise<StaffLeave[]> {
    const societyId = user.societyId as string;
    await this.findRawStaffMember(societyId, staffId);

    const qb = this.leavesRepo.createQueryBuilder('l')
      .where('l.society_id = :societyId AND l.staff_id = :staffId', { societyId, staffId });

    if (query.status) qb.andWhere('l.status = :status', { status: query.status });
    if (query.leaveType) qb.andWhere('l.leave_type = :leaveType', { leaveType: query.leaveType });
    if (query.startDate && query.endDate) {
      qb.andWhere('l.start_date >= :startDate AND l.end_date <= :endDate', {
        startDate: query.startDate,
        endDate: query.endDate,
      });
    }

    return qb.orderBy('l.start_date', 'DESC').getMany();
  }

  async findAllPendingLeaves(user: AuthUser): Promise<StaffLeave[]> {
    return this.leavesRepo.find({
      where: { societyId: user.societyId as string, status: LeaveStatus.PENDING },
      order: { createdAt: 'ASC' },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ✅ TASK MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  async createTask(user: AuthUser, staffId: string, dto: CreateTaskDto): Promise<StaffTask> {
    const societyId = user.societyId as string;
    await this.findRawStaffMember(societyId, staffId);

    const task = this.tasksRepo.create({
      societyId,
      staffId,
      assignedByUserId: user.sub,
      title: dto.title,
      description: dto.description ?? null,
      dueDate: dto.dueDate ?? null,
      isCompleted: false,
    });

    return this.tasksRepo.save(task);
  }

  async findTasks(user: AuthUser, staffId: string): Promise<StaffTask[]> {
    const societyId = user.societyId as string;
    await this.findRawStaffMember(societyId, staffId);

    return this.tasksRepo.find({
      where: { societyId, staffId },
      order: { isCompleted: 'ASC', createdAt: 'DESC' },
    });
  }

  async completeTask(user: AuthUser, taskId: string, dto: CompleteTaskDto): Promise<StaffTask> {
    const societyId = user.societyId as string;
    const task = await this.tasksRepo.findOne({ where: { id: taskId, societyId } });
    if (!task) throw new NotFoundException(`Task with ID '${taskId}' not found`);

    if (task.isCompleted) {
      throw new BadRequestException('Task is already marked as completed');
    }

    task.isCompleted = true;
    task.completedAt = new Date();
    task.completionNotes = dto.completionNotes ?? null;

    return this.tasksRepo.save(task);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📊 ANALYTICS
  // ═══════════════════════════════════════════════════════════════════════════

  async getAnalytics(user: AuthUser): Promise<{
    totalActive: number;
    totalDomesticHelp: number;
    todayPresent: number;
    todayAbsent: number;
    todayOnLeave: number;
    pendingLeaves: number;
    pendingTasks: number;
    byType: Record<string, number>;
  }> {
    const societyId = user.societyId as string;
    const today = new Date().toISOString().split('T')[0];

    const totalActive = await this.staffRepo.count({
      where: { societyId, status: StaffStatus.ACTIVE },
    });

    const totalDomesticHelp = await this.staffRepo.count({
      where: { societyId, isDomesticHelp: true, status: StaffStatus.ACTIVE },
    });

    const todayPresent = await this.attendanceRepo.count({
      where: { societyId, date: today, status: AttendanceStatus.PRESENT },
    });

    const todayAbsent = await this.attendanceRepo.count({
      where: { societyId, date: today, status: AttendanceStatus.ABSENT },
    });

    const todayOnLeave = await this.attendanceRepo.count({
      where: { societyId, date: today, status: AttendanceStatus.ON_LEAVE },
    });

    const pendingLeaves = await this.leavesRepo.count({
      where: { societyId, status: LeaveStatus.PENDING },
    });

    const pendingTasks = await this.tasksRepo.count({
      where: { societyId, isCompleted: false },
    });

    // Count by staff type
    const rawByType = await this.staffRepo
      .createQueryBuilder('s')
      .select('s.staff_type', 'type')
      .addSelect('COUNT(s.id)', 'count')
      .where('s.society_id = :societyId AND s.status = :status', {
        societyId,
        status: StaffStatus.ACTIVE,
      })
      .groupBy('s.staff_type')
      .getRawMany();

    const byType: Record<string, number> = {};
    for (const item of rawByType) {
      byType[item.type] = parseInt(item.count, 10);
    }

    return {
      totalActive,
      totalDomesticHelp,
      todayPresent,
      todayAbsent,
      todayOnLeave,
      pendingLeaves,
      pendingTasks,
      byType,
    };
  }
}
