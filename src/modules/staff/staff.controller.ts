import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StaffService } from './staff.service';
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
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

const STAFF_MANAGERS = [
  Role.SUPER_ADMIN,
  Role.SOCIETY_ADMIN,
  Role.FACILITY_MANAGER,
] as const;

@ApiTags('Staff & Domestic Help')
@ApiBearerAuth('access-token')
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // 👤 STAFF PROFILES
  // ═══════════════════════════════════════════════════════════════════════════

  @Post()
  @Roles(...STAFF_MANAGERS)
  @ApiOperation({ summary: 'Create a new staff member or domestic helper profile' })
  @ApiResponse({ status: 201, description: 'Staff member created with auto-generated staff code' })
  async createStaffMember(@CurrentUser() user: AuthUser, @Body() dto: CreateStaffMemberDto) {
    return this.staffService.createStaffMember(user, dto);
  }

  @Get()
  @Roles(...STAFF_MANAGERS, Role.COMMITTEE_MEMBER)
  @ApiOperation({ summary: 'List all staff members (filterable by type, status, shift, domestic help)' })
  async findStaffMembers(@CurrentUser() user: AuthUser, @Query() query: StaffQueryDto) {
    return this.staffService.findStaffMembers(user, query);
  }

  @Get('analytics')
  @Roles(...STAFF_MANAGERS)
  @ApiOperation({ summary: 'Staff dashboard KPIs — active count, today\'s attendance, pending leaves & tasks' })
  async getAnalytics(@CurrentUser() user: AuthUser) {
    return this.staffService.getAnalytics(user);
  }

  @Get('attendance/report')
  @Roles(...STAFF_MANAGERS)
  @ApiOperation({ summary: 'Society-wide attendance report by date (aggregated)' })
  async getSocietyAttendanceReport(@CurrentUser() user: AuthUser, @Query() query: AttendanceQueryDto) {
    return this.staffService.getSocietyAttendanceReport(user, query);
  }

  @Get('leaves/pending')
  @Roles(...STAFF_MANAGERS)
  @ApiOperation({ summary: 'List all pending leave applications awaiting approval' })
  async findAllPendingLeaves(@CurrentUser() user: AuthUser) {
    return this.staffService.findAllPendingLeaves(user);
  }

  @Get(':id')
  @Roles(...STAFF_MANAGERS, Role.COMMITTEE_MEMBER)
  @ApiOperation({ summary: 'Get staff member profile by ID (Aadhaar masked)' })
  async findStaffMemberById(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.staffService.findStaffMemberById(user, id);
  }

  @Patch(':id')
  @Roles(...STAFF_MANAGERS)
  @ApiOperation({ summary: 'Update staff member profile details or documents' })
  async updateStaffMember(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStaffMemberDto,
  ) {
    return this.staffService.updateStaffMember(user, id, dto);
  }

  @Patch(':id/exit')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @ApiOperation({ summary: 'Record staff member exit (resignation, termination)' })
  async exitStaffMember(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExitStaffMemberDto,
  ) {
    return this.staffService.exitStaffMember(user, id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN)
  @ApiOperation({ summary: 'Soft delete staff member record (Admin)' })
  async deleteStaffMember(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.staffService.deleteStaffMember(user, id);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📅 ATTENDANCE
  // ═══════════════════════════════════════════════════════════════════════════

  @Post(':id/attendance')
  @Roles(...STAFF_MANAGERS, Role.SECURITY_GUARD)
  @ApiOperation({ summary: 'Mark attendance for a single staff member (Guard can also mark)' })
  async recordAttendance(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordAttendanceDto,
  ) {
    return this.staffService.recordAttendance(user, id, dto);
  }

  @Post('attendance/bulk')
  @Roles(...STAFF_MANAGERS, Role.SECURITY_GUARD)
  @ApiOperation({ summary: 'Bulk mark attendance for multiple staff members at once' })
  async recordBulkAttendance(
    @CurrentUser() user: AuthUser,
    @Body() dto: RecordBulkAttendanceDto,
  ) {
    return this.staffService.recordBulkAttendance(user, dto);
  }

  @Get(':id/attendance')
  @Roles(...STAFF_MANAGERS)
  @ApiOperation({ summary: 'Get attendance history for a specific staff member' })
  async getStaffAttendance(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: AttendanceQueryDto,
  ) {
    return this.staffService.getStaffAttendance(user, id, query);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🕐 SHIFTS
  // ═══════════════════════════════════════════════════════════════════════════

  @Post(':id/shifts')
  @Roles(...STAFF_MANAGERS)
  @ApiOperation({ summary: 'Create a shift schedule for a staff member' })
  async createShift(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateStaffShiftDto,
  ) {
    return this.staffService.createShift(user, id, dto);
  }

  @Get(':id/shifts')
  @Roles(...STAFF_MANAGERS)
  @ApiOperation({ summary: 'List all shift schedules for a staff member' })
  async findShifts(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.staffService.findShifts(user, id);
  }

  @Patch(':id/shifts/:shiftId')
  @Roles(...STAFF_MANAGERS)
  @ApiOperation({ summary: 'Update a shift schedule' })
  async updateShift(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('shiftId', ParseUUIDPipe) shiftId: string,
    @Body() dto: UpdateStaffShiftDto,
  ) {
    return this.staffService.updateShift(user, id, shiftId, dto);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏖️ LEAVE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  @Post(':id/leaves')
  @Roles(...STAFF_MANAGERS)
  @ApiOperation({ summary: 'Apply a leave for a staff member (triggers manager notification)' })
  async applyLeave(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApplyLeaveDto,
  ) {
    return this.staffService.applyLeave(user, id, dto);
  }

  @Get(':id/leaves')
  @Roles(...STAFF_MANAGERS)
  @ApiOperation({ summary: 'List all leaves for a staff member' })
  async findLeaves(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: LeaveQueryDto,
  ) {
    return this.staffService.findLeaves(user, id, query);
  }

  @Patch('leaves/:leaveId/process')
  @Roles(...STAFF_MANAGERS)
  @ApiOperation({ summary: 'Approve or reject a staff leave application' })
  async processLeave(
    @CurrentUser() user: AuthUser,
    @Param('leaveId', ParseUUIDPipe) leaveId: string,
    @Body() dto: ProcessLeaveDto,
  ) {
    return this.staffService.processLeave(user, leaveId, dto);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ✅ WORK TASKS
  // ═══════════════════════════════════════════════════════════════════════════

  @Post(':id/tasks')
  @Roles(...STAFF_MANAGERS)
  @ApiOperation({ summary: 'Assign a work task to a staff member' })
  async createTask(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.staffService.createTask(user, id, dto);
  }

  @Get(':id/tasks')
  @Roles(...STAFF_MANAGERS)
  @ApiOperation({ summary: 'List all tasks assigned to a staff member' })
  async findTasks(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.staffService.findTasks(user, id);
  }

  @Patch('tasks/:taskId/complete')
  @Roles(...STAFF_MANAGERS)
  @ApiOperation({ summary: 'Mark a task as completed with optional notes' })
  async completeTask(
    @CurrentUser() user: AuthUser,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: CompleteTaskDto,
  ) {
    return this.staffService.completeTask(user, taskId, dto);
  }
}
