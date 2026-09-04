import {
  Controller, Get, Post, Patch, Body, Param,
  HttpCode, HttpStatus, ParseUUIDPipe, Query,
} from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
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
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  // ─── Create Complaint ─────────────────────────────────────────────────────

  @Post()
  @Roles(
    Role.RESIDENT, Role.TENANT,
    Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER, Role.COMMITTEE_MEMBER,
  )
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateComplaintDto, @CurrentUser() user: AuthUser) {
    return this.complaintsService.create(user, dto);
  }

  // ─── List Complaints (scoped by role) ─────────────────────────────────────

  @Get()
  @Roles(
    Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER,
    Role.COMMITTEE_MEMBER, Role.RESIDENT, Role.TENANT,
  )
  findAll(@Query() query: ComplaintQueryDto, @CurrentUser() user: AuthUser) {
    return this.complaintsService.findAll(user, query);
  }

  // ─── Analytics ────────────────────────────────────────────────────────────

  @Get('analytics')
  @Roles(
    Role.SUPER_ADMIN, Role.SOCIETY_ADMIN,
    Role.FACILITY_MANAGER, Role.COMMITTEE_MEMBER,
  )
  getAnalytics(@CurrentUser() user: AuthUser) {
    return this.complaintsService.getAnalytics(user.societyId as string);
  }

  // ─── SLA Config ───────────────────────────────────────────────────────────

  @Post('sla')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @HttpCode(HttpStatus.OK)
  upsertSlaConfig(@Body() dto: UpsertSlaConfigDto, @CurrentUser() user: AuthUser) {
    return this.complaintsService.upsertSlaConfig(user.societyId as string, dto);
  }

  @Get('sla')
  @Roles(
    Role.SUPER_ADMIN, Role.SOCIETY_ADMIN,
    Role.FACILITY_MANAGER, Role.COMMITTEE_MEMBER,
  )
  findAllSlaConfigs(@CurrentUser() user: AuthUser) {
    return this.complaintsService.findAllSlaConfigs(user.societyId as string);
  }

  // ─── Single Complaint ─────────────────────────────────────────────────────

  @Get(':id')
  @Roles(
    Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER,
    Role.COMMITTEE_MEMBER, Role.RESIDENT, Role.TENANT,
  )
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.complaintsService.findOne(user, id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateComplaintDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.complaintsService.update(user, id, dto);
  }

  // ─── Assign ───────────────────────────────────────────────────────────────

  @Patch(':id/assign')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  assignComplaint(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignComplaintDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.complaintsService.assignComplaint(user, id, dto);
  }

  // ─── Status ───────────────────────────────────────────────────────────────

  @Patch(':id/status')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.complaintsService.updateStatus(user, id, dto);
  }

  // ─── Comments ─────────────────────────────────────────────────────────────

  @Post(':id/comments')
  @Roles(
    Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER,
    Role.COMMITTEE_MEMBER, Role.RESIDENT, Role.TENANT,
  )
  @HttpCode(HttpStatus.CREATED)
  addComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddCommentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.complaintsService.addComment(user, id, dto);
  }

  @Get(':id/comments')
  @Roles(
    Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER,
    Role.COMMITTEE_MEMBER, Role.RESIDENT, Role.TENANT,
  )
  getComments(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.complaintsService.getComments(user, id);
  }

  // ─── Close (Resident confirms resolution) ─────────────────────────────────

  @Patch(':id/close')
  @Roles(Role.RESIDENT, Role.TENANT)
  closeComplaint(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CloseComplaintDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.complaintsService.closeComplaint(user, id, dto);
  }
}
