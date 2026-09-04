import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { VisitorsService } from './visitors.service';
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
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, ADMIN_ROLES, RESIDENT_ROLES } from '../../common/enums/role.enum';
import { IncidentStatus } from '../../common/enums/visitor.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

@ApiTags('Visitors & Security Gates')
@ApiBearerAuth('JWT-auth')
@Controller()
export class VisitorsController {
  constructor(private readonly visitorsService: VisitorsService) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // 🚪 GATES & GUARD SHIFTS
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('gates')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @ApiOperation({ summary: 'Create a new society gate (Admin)' })
  @ApiResponse({ status: 201, description: 'Gate created successfully' })
  async createGate(@CurrentUser() user: AuthUser, @Body() dto: CreateGateDto) {
    return this.visitorsService.createGate(user, dto);
  }

  @Get('gates')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.FACILITY_MANAGER,
    Role.SECURITY_GUARD,
    Role.RESIDENT,
    Role.TENANT,
  )
  @ApiOperation({ summary: 'List all gates for the current society' })
  async findGates(@CurrentUser() user: AuthUser) {
    return this.visitorsService.findGates(user);
  }

  @Get('gates/:id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.FACILITY_MANAGER,
    Role.SECURITY_GUARD,
    Role.RESIDENT,
    Role.TENANT,
  )
  @ApiOperation({ summary: 'Get gate by ID' })
  async findGateById(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.visitorsService.findGateById(user, id);
  }

  @Patch('gates/:id')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @ApiOperation({ summary: 'Update gate details' })
  async updateGate(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGateDto,
  ) {
    return this.visitorsService.updateGate(user, id, dto);
  }

  @Delete('gates/:id')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @ApiOperation({ summary: 'Soft-delete a gate' })
  async deleteGate(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.visitorsService.deleteGate(user, id);
  }

  @Post('gates/:id/assign')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @ApiOperation({ summary: 'Assign a security guard shift to a gate' })
  async assignGuard(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignGuardDto,
  ) {
    return this.visitorsService.assignGuard(user, id, dto);
  }

  @Get('gates/:id/assignments')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER, Role.SECURITY_GUARD)
  @ApiOperation({ summary: 'List shift assignments for a gate' })
  async findGateAssignments(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.visitorsService.findGateAssignments(user, id);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 👥 VISITOR INVITATIONS & ENTRIES
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('visitors/invite')
  @Roles(Role.RESIDENT, Role.TENANT, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @ApiOperation({ summary: 'Resident creates visitor pass (Generates 6-digit OTP & QR Token)' })
  @ApiResponse({ status: 201, description: 'Visitor invitation created' })
  async inviteVisitor(@CurrentUser() user: AuthUser, @Body() dto: InviteVisitorDto) {
    return this.visitorsService.inviteVisitor(user, dto);
  }

  @Post('visitors/walk-in')
  @Roles(Role.SECURITY_GUARD, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @ApiOperation({ summary: 'Guard registers walk-in visitor at gate & notifies host' })
  @ApiResponse({ status: 201, description: 'Walk-in visitor recorded and checked in' })
  async walkInVisitor(@CurrentUser() user: AuthUser, @Body() dto: WalkInVisitorDto) {
    return this.visitorsService.walkInVisitor(user, dto);
  }

  @Get('visitors')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.FACILITY_MANAGER,
    Role.SECURITY_GUARD,
    Role.RESIDENT,
    Role.TENANT,
  )
  @ApiOperation({ summary: 'List visitors (Residents scoped to own unit)' })
  async findVisitors(@CurrentUser() user: AuthUser, @Query() query: VisitorQueryDto) {
    return this.visitorsService.findVisitors(user, query);
  }

  @Get('visitors/my-invitations')
  @Roles(Role.RESIDENT, Role.TENANT, ...ADMIN_ROLES)
  @ApiOperation({ summary: 'List all invitations created by current user' })
  async findMyInvitations(@CurrentUser() user: AuthUser) {
    return this.visitorsService.findMyInvitations(user);
  }

  @Get('visitors/verify/:code')
  @Roles(Role.SECURITY_GUARD, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @ApiOperation({ summary: 'Guard verifies 6-digit passcode or QR token string' })
  async verifyCode(@CurrentUser() user: AuthUser, @Param('code') code: string) {
    return this.visitorsService.verifyPasscodeOrQr(user, code);
  }

  @Post('visitors/:id/check-in')
  @Roles(Role.SECURITY_GUARD, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @ApiOperation({ summary: 'Guard checks in verified visitor at gate' })
  async checkInVisitor(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CheckInVisitorDto,
  ) {
    return this.visitorsService.checkInVisitor(user, id, dto);
  }

  @Post('visitors/:id/check-out')
  @Roles(Role.SECURITY_GUARD, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @ApiOperation({ summary: 'Guard checks out visitor upon exit' })
  async checkOutVisitor(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CheckOutVisitorDto,
  ) {
    return this.visitorsService.checkOutVisitor(user, id, dto);
  }

  @Post('visitors/:id/blacklist')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @ApiOperation({ summary: 'Blacklist a visitor by ID' })
  async blacklistVisitor(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BlacklistVisitorDto,
  ) {
    return this.visitorsService.blacklistVisitor(user, id, dto);
  }

  @Get('visitors/analytics')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER, Role.SECURITY_GUARD)
  @ApiOperation({ summary: 'Real-time visitor counts (Inside now, today total, walk-ins)' })
  async getAnalytics(@CurrentUser() user: AuthUser) {
    return this.visitorsService.getAnalytics(user);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🚨 SECURITY INCIDENTS & SOS
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('security-incidents')
  @ApiOperation({ summary: 'Report security incident or trigger SOS Panic Alert (All users)' })
  @ApiResponse({ status: 201, description: 'Security incident logged' })
  async createIncident(@CurrentUser() user: AuthUser, @Body() dto: CreateIncidentDto) {
    return this.visitorsService.createIncident(user, dto);
  }

  @Get('security-incidents')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER, Role.SECURITY_GUARD)
  @ApiOperation({ summary: 'List security incidents in society' })
  @ApiQuery({ name: 'status', enum: IncidentStatus, required: false })
  async findIncidents(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: IncidentStatus,
  ) {
    return this.visitorsService.findIncidents(user, status);
  }

  @Patch('security-incidents/:id/resolve')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER, Role.SECURITY_GUARD)
  @ApiOperation({ summary: 'Resolve a security incident with notes' })
  async resolveIncident(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveIncidentDto,
  ) {
    return this.visitorsService.resolveIncident(user, id, dto);
  }
}
