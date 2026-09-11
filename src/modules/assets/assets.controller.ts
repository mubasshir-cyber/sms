import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import {
  CreateAssetDto,
  UpdateAssetDto,
  DisposeAssetDto,
  AssetFilterDto,
  CreateMaintenanceLogDto,
  UpdateMaintenanceLogDto,
  CreateMaintenanceScheduleDto,
  UpdateMaintenanceScheduleDto,
  RecordDepreciationDto,
} from './dto/assets.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

@ApiTags('Assets')
@ApiBearerAuth('JWT-auth')
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏗️ ASSETS
  // ═══════════════════════════════════════════════════════════════════════════

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new asset in the society' })
  @ApiResponse({ status: 201, description: 'Asset created successfully' })
  async createAsset(@CurrentUser() user: AuthUser, @Body() dto: CreateAssetDto) {
    return this.assetsService.createAsset(user, dto);
  }

  @Get()
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.COMMITTEE_MEMBER,
    Role.FACILITY_MANAGER,
    Role.ACCOUNTANT,
  )
  @ApiOperation({ summary: 'List all assets (filterable by category and status)' })
  @ApiResponse({ status: 200, description: 'Assets retrieved' })
  async findAllAssets(@CurrentUser() user: AuthUser, @Query() filter: AssetFilterDto) {
    return this.assetsService.findAllAssets(user, filter);
  }

  @Get('due-maintenance')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @ApiOperation({ summary: 'Get assets with overdue maintenance or expiring warranty/AMC' })
  @ApiResponse({ status: 200, description: 'Due-maintenance summary retrieved' })
  async getDueMaintenanceAssets(@CurrentUser() user: AuthUser) {
    return this.assetsService.getDueMaintenanceAssets(user);
  }

  @Get(':id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.COMMITTEE_MEMBER,
    Role.FACILITY_MANAGER,
    Role.ACCOUNTANT,
  )
  @ApiOperation({ summary: 'Get a single asset with maintenance and depreciation details' })
  @ApiResponse({ status: 200, description: 'Asset retrieved' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async findAssetById(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.assetsService.findAssetById(user, id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @ApiOperation({ summary: 'Update asset details' })
  @ApiResponse({ status: 200, description: 'Asset updated' })
  async updateAsset(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAssetDto,
  ) {
    return this.assetsService.updateAsset(user, id, dto);
  }

  @Post(':id/dispose')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark an asset as disposed / written off' })
  @ApiResponse({ status: 200, description: 'Asset disposed' })
  async disposeAsset(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DisposeAssetDto,
  ) {
    return this.assetsService.disposeAsset(user, id, dto);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔧 MAINTENANCE LOGS
  // ═══════════════════════════════════════════════════════════════════════════

  @Post(':id/maintenance-logs')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a maintenance log entry for an asset' })
  @ApiResponse({ status: 201, description: 'Maintenance log created' })
  async addMaintenanceLog(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMaintenanceLogDto,
  ) {
    return this.assetsService.addMaintenanceLog(user, id, dto);
  }

  @Get(':id/maintenance-logs')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.COMMITTEE_MEMBER,
    Role.FACILITY_MANAGER,
    Role.ACCOUNTANT,
  )
  @ApiOperation({ summary: 'Get all maintenance logs for an asset' })
  @ApiResponse({ status: 200, description: 'Maintenance logs retrieved' })
  async getMaintenanceLogs(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.assetsService.getMaintenanceLogs(user, id);
  }

  @Patch(':id/maintenance-logs/:logId')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @ApiOperation({ summary: 'Update a maintenance log entry' })
  @ApiResponse({ status: 200, description: 'Maintenance log updated' })
  async updateMaintenanceLog(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('logId', ParseUUIDPipe) logId: string,
    @Body() dto: UpdateMaintenanceLogDto,
  ) {
    return this.assetsService.updateMaintenanceLog(user, id, logId, dto);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📅 MAINTENANCE SCHEDULES
  // ═══════════════════════════════════════════════════════════════════════════

  @Post(':id/schedules')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a recurring maintenance schedule for an asset' })
  @ApiResponse({ status: 201, description: 'Schedule created' })
  async createSchedule(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMaintenanceScheduleDto,
  ) {
    return this.assetsService.createSchedule(user, id, dto);
  }

  @Patch(':id/schedules/:scheduleId')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @ApiOperation({ summary: 'Update or deactivate a maintenance schedule' })
  @ApiResponse({ status: 200, description: 'Schedule updated' })
  async updateSchedule(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('scheduleId', ParseUUIDPipe) scheduleId: string,
    @Body() dto: UpdateMaintenanceScheduleDto,
  ) {
    return this.assetsService.updateSchedule(user, id, scheduleId, dto);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📉 DEPRECIATION
  // ═══════════════════════════════════════════════════════════════════════════

  @Post(':id/depreciation')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a depreciation entry for an asset' })
  @ApiResponse({ status: 201, description: 'Depreciation entry recorded' })
  async recordDepreciation(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordDepreciationDto,
  ) {
    return this.assetsService.recordDepreciation(user, id, dto);
  }

  @Get(':id/depreciation')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.COMMITTEE_MEMBER,
    Role.FACILITY_MANAGER,
    Role.ACCOUNTANT,
  )
  @ApiOperation({ summary: 'Get depreciation history for an asset' })
  @ApiResponse({ status: 200, description: 'Depreciation logs retrieved' })
  async getDepreciationLogs(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.assetsService.getDepreciationLogs(user, id);
  }
}
