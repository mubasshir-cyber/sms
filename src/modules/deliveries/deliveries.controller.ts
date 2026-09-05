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
import { DeliveriesService } from './deliveries.service';
import {
  CreateDeliveryDto,
  PreApproveDeliveryDto,
  CollectDeliveryDto,
  VerifyDeliveryOtpDto,
  AllowDirectEntryDto,
  ReturnDeliveryDto,
  UpdateDeliveryDto,
  DeliveryQueryDto,
} from './dto/deliveries.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, ADMIN_ROLES, RESIDENT_ROLES } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

@ApiTags('Deliveries & Parcels')
@ApiBearerAuth('access-token')
@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // 📦 LOGGING & PRE-APPROVAL
  // ═══════════════════════════════════════════════════════════════════════════

  @Post()
  @Roles(Role.SECURITY_GUARD, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Guard logs incoming delivery at gate & notifies resident' })
  @ApiResponse({ status: 201, description: 'Delivery logged successfully and OTP generated' })
  async createDelivery(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateDeliveryDto,
  ) {
    return this.deliveriesService.createDelivery(user, dto);
  }

  @Post('pre-approve')
  @Roles(Role.RESIDENT, Role.TENANT, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @ApiOperation({ summary: 'Resident pre-approves an incoming delivery pass' })
  @ApiResponse({ status: 201, description: 'Delivery pre-approved' })
  async preApproveDelivery(
    @CurrentUser() user: AuthUser,
    @Body() dto: PreApproveDeliveryDto,
  ) {
    return this.deliveriesService.preApproveDelivery(user, dto);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔍 LIST & QUERY ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════════

  @Get()
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.FACILITY_MANAGER,
    Role.SECURITY_GUARD,
    Role.RESIDENT,
    Role.TENANT,
  )
  @ApiOperation({ summary: 'List deliveries (Residents automatically scoped to own unit)' })
  async findDeliveries(
    @CurrentUser() user: AuthUser,
    @Query() query: DeliveryQueryDto,
  ) {
    return this.deliveriesService.findDeliveries(user, query);
  }

  @Get('pending')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.FACILITY_MANAGER,
    Role.SECURITY_GUARD,
    Role.RESIDENT,
    Role.TENANT,
  )
  @ApiOperation({ summary: 'List all pending packages awaiting pickup at gate' })
  async findPendingDeliveries(@CurrentUser() user: AuthUser) {
    return this.deliveriesService.findPendingDeliveries(user);
  }

  @Get('unattended')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.FACILITY_MANAGER,
    Role.SECURITY_GUARD,
  )
  @ApiOperation({ summary: 'List unattended parcels (> 24 hours at gate)' })
  async findUnattendedDeliveries(@CurrentUser() user: AuthUser) {
    return this.deliveriesService.findUnattendedDeliveries(user);
  }

  @Get('my-deliveries')
  @Roles(Role.RESIDENT, Role.TENANT, ...ADMIN_ROLES)
  @ApiOperation({ summary: 'List deliveries for current resident unit' })
  async findMyDeliveries(@CurrentUser() user: AuthUser) {
    return this.deliveriesService.findMyDeliveries(user);
  }

  @Get('analytics')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.FACILITY_MANAGER,
    Role.SECURITY_GUARD,
  )
  @ApiOperation({ summary: 'Delivery metrics (today total, pending, collected, breakdown by type)' })
  async getAnalytics(@CurrentUser() user: AuthUser) {
    return this.deliveriesService.getAnalytics(user);
  }

  @Get(':id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.FACILITY_MANAGER,
    Role.SECURITY_GUARD,
    Role.RESIDENT,
    Role.TENANT,
  )
  @ApiOperation({ summary: 'Get delivery details by ID' })
  async findDeliveryById(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.deliveriesService.findDeliveryById(user, id);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🤝 COLLECTION, OTP & ACTION ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════════

  @Post(':id/verify-otp')
  @Roles(Role.SECURITY_GUARD, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @ApiOperation({ summary: 'Guard verifies 6-digit pickup OTP for parcel handover' })
  async verifyPickupOtp(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyDeliveryOtpDto,
  ) {
    return this.deliveriesService.verifyPickupOtp(user, id, dto);
  }

  @Post(':id/collect')
  @Roles(Role.SECURITY_GUARD, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @ApiOperation({ summary: 'Guard records parcel handover/collection by resident' })
  async collectDelivery(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CollectDeliveryDto,
  ) {
    return this.deliveriesService.collectDelivery(user, id, dto);
  }

  @Post(':id/allow-entry')
  @Roles(Role.SECURITY_GUARD, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @ApiOperation({ summary: 'Guard permits delivery partner direct access to resident unit' })
  async allowDirectEntry(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AllowDirectEntryDto,
  ) {
    return this.deliveriesService.allowDirectEntry(user, id, dto);
  }

  @Post(':id/return')
  @Roles(Role.SECURITY_GUARD, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @ApiOperation({ summary: 'Mark delivery as returned / rejected / courier returned' })
  async returnDelivery(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReturnDeliveryDto,
  ) {
    return this.deliveriesService.returnDelivery(user, id, dto);
  }

  @Patch(':id')
  @Roles(Role.SECURITY_GUARD, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @ApiOperation({ summary: 'Update delivery metadata or storage notes' })
  async updateDelivery(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDeliveryDto,
  ) {
    return this.deliveriesService.updateDelivery(user, id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @ApiOperation({ summary: 'Soft delete delivery record (Admin)' })
  async deleteDelivery(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.deliveriesService.deleteDelivery(user, id);
  }
}
