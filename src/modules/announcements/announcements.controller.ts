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
import { AnnouncementsService } from './announcements.service';
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  PublishAnnouncementDto,
  AnnouncementQueryDto,
} from './dto/announcements.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

const PUBLISHERS = [
  Role.SUPER_ADMIN,
  Role.SOCIETY_ADMIN,
  Role.COMMITTEE_MEMBER,
  Role.FACILITY_MANAGER,
] as const;

const ADMINS = [Role.SUPER_ADMIN, Role.SOCIETY_ADMIN] as const;

const ALL_SOCIETY_ROLES = [
  Role.SUPER_ADMIN,
  Role.SOCIETY_ADMIN,
  Role.COMMITTEE_MEMBER,
  Role.FACILITY_MANAGER,
  Role.ACCOUNTANT,
  Role.RESIDENT,
  Role.TENANT,
  Role.SECURITY_GUARD,
] as const;

@ApiTags('Notice Board & Announcements')
@ApiBearerAuth('access-token')
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  // ─── Create ───────────────────────────────────────────────────────────────

  @Post()
  @Roles(...PUBLISHERS)
  @ApiOperation({ summary: 'Create a new announcement as a draft' })
  @ApiResponse({ status: 201, description: 'Draft announcement created' })
  async createAnnouncement(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateAnnouncementDto,
  ) {
    return this.announcementsService.createAnnouncement(user, dto);
  }

  // ─── Feed / List ──────────────────────────────────────────────────────────

  @Get()
  @Roles(...ALL_SOCIETY_ROLES)
  @ApiOperation({
    summary: 'Announcement feed — pinned first, then by publish date. Residents see published only.',
  })
  async findAnnouncements(
    @CurrentUser() user: AuthUser,
    @Query() query: AnnouncementQueryDto,
  ) {
    return this.announcementsService.findAnnouncements(user, query);
  }

  @Get('unread-count')
  @Roles(...ALL_SOCIETY_ROLES)
  @ApiOperation({ summary: 'Unread announcement badge count for the current user' })
  async getUnreadCount(@CurrentUser() user: AuthUser) {
    return this.announcementsService.getUnreadCount(user);
  }

  @Get(':id')
  @Roles(...ALL_SOCIETY_ROLES)
  @ApiOperation({ summary: 'Get single announcement with read status for the current user' })
  async findById(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.announcementsService.findById(user, id);
  }

  // ─── Update / Publish / Archive / Pin ────────────────────────────────────

  @Patch(':id')
  @Roles(...PUBLISHERS)
  @ApiOperation({ summary: 'Edit a draft announcement (cannot edit published)' })
  async updateAnnouncement(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAnnouncementDto,
  ) {
    return this.announcementsService.updateAnnouncement(user, id, dto);
  }

  @Post(':id/publish')
  @Roles(...PUBLISHERS)
  @ApiOperation({
    summary: 'Publish immediately or schedule for future. Omit publishAt for instant publish.',
  })
  async publishAnnouncement(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PublishAnnouncementDto,
  ) {
    return this.announcementsService.publishAnnouncement(user, id, dto);
  }

  @Patch(':id/pin')
  @Roles(...ADMINS)
  @ApiOperation({ summary: 'Toggle pinned status of an announcement' })
  async togglePin(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.announcementsService.togglePin(user, id);
  }

  @Patch(':id/archive')
  @Roles(...PUBLISHERS)
  @ApiOperation({ summary: 'Archive an announcement (also cancels any pending scheduled job)' })
  async archiveAnnouncement(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.announcementsService.archiveAnnouncement(user, id);
  }

  @Delete(':id')
  @Roles(...ADMINS)
  @ApiOperation({ summary: 'Soft delete an announcement (Admin only)' })
  async deleteAnnouncement(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.announcementsService.deleteAnnouncement(user, id);
  }

  // ─── Read Tracking ────────────────────────────────────────────────────────

  @Post(':id/read')
  @Roles(...ALL_SOCIETY_ROLES)
  @ApiOperation({ summary: 'Mark announcement as read (idempotent)' })
  async markAsRead(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.announcementsService.markAsRead(user, id);
  }

  @Get(':id/read-receipt')
  @Roles(...PUBLISHERS)
  @ApiOperation({ summary: 'Read receipt — how many users have read this announcement (Admin view)' })
  async getReadReceipt(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.announcementsService.getReadReceipt(user, id);
  }
}
