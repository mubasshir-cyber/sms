import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  HttpCode, HttpStatus, ParseUUIDPipe, Query, ParseIntPipe,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MaintenanceService } from './maintenance.service';
import {
  CreateMaintenanceHeadDto, UpdateMaintenanceHeadDto,
  CreateBillingRuleDto, UpdateBillingRuleDto,
  UpsertLateFeeConfigDto, GenerateInvoicesDto, WaiveInvoiceDto,
} from './dto/maintenance.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { BILLING_QUEUE } from './billing.scheduler';

@Controller('maintenance')
export class MaintenanceController {
  constructor(
    private readonly maintenanceService: MaintenanceService,
    @InjectQueue(BILLING_QUEUE) private readonly billingQueue: Queue,
  ) {}

  private sid(user: AuthUser): string { return user.societyId as string; }

  // ─── Maintenance Heads ────────────────────────────────────────────────────

  @Post('heads')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT)
  @HttpCode(HttpStatus.CREATED)
  createHead(@Body() dto: CreateMaintenanceHeadDto, @CurrentUser() user: AuthUser) {
    return this.maintenanceService.createHead(this.sid(user), dto);
  }

  @Get('heads')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT, Role.COMMITTEE_MEMBER)
  findAllHeads(@CurrentUser() user: AuthUser) {
    return this.maintenanceService.findAllHeads(this.sid(user));
  }

  @Patch('heads/:id')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT)
  updateHead(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMaintenanceHeadDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.maintenanceService.updateHead(this.sid(user), id, dto);
  }

  @Delete('heads/:id')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeHead(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.maintenanceService.removeHead(this.sid(user), id);
  }

  // ─── Billing Rules ────────────────────────────────────────────────────────

  @Post('rules')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT)
  @HttpCode(HttpStatus.CREATED)
  createRule(@Body() dto: CreateBillingRuleDto, @CurrentUser() user: AuthUser) {
    return this.maintenanceService.createRule(this.sid(user), dto);
  }

  @Get('rules')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT, Role.COMMITTEE_MEMBER)
  findAllRules(@CurrentUser() user: AuthUser) {
    return this.maintenanceService.findAllRules(this.sid(user));
  }

  @Patch('rules/:id')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT)
  updateRule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBillingRuleDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.maintenanceService.updateRule(this.sid(user), id, dto);
  }

  @Delete('rules/:id')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeRule(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.maintenanceService.removeRule(this.sid(user), id);
  }

  // ─── Late Fee Config ──────────────────────────────────────────────────────

  @Post('late-fee')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT)
  upsertLateFee(@Body() dto: UpsertLateFeeConfigDto, @CurrentUser() user: AuthUser) {
    return this.maintenanceService.upsertLateFeeConfig(this.sid(user), dto);
  }

  @Get('late-fee')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT, Role.COMMITTEE_MEMBER)
  getLateFee(@CurrentUser() user: AuthUser) {
    return this.maintenanceService.getLateFeeConfig(this.sid(user));
  }

  // ─── Invoices ─────────────────────────────────────────────────────────────

  @Post('invoices/generate')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT)
  generateInvoices(@Body() dto: GenerateInvoicesDto, @CurrentUser() user: AuthUser) {
    return this.maintenanceService.generateInvoices(this.sid(user), dto);
  }

  @Post('invoices/bulk-generate')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT)
  async bulkGenerate(@CurrentUser() user: AuthUser) {
    const now = new Date();
    await this.billingQueue.add('generate-invoices', {
      societyId: this.sid(user),
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    });
    return { message: 'Bulk invoice generation queued' };
  }

  @Get('invoices')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT, Role.COMMITTEE_MEMBER)
  findAllInvoices(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('unitId') unitId?: string,
  ) {
    return this.maintenanceService.findAllInvoices(this.sid(user), {
      status,
      month: month ? parseInt(month, 10) : undefined,
      year: year ? parseInt(year, 10) : undefined,
      unitId,
    });
  }

  @Get('invoices/:id')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT, Role.COMMITTEE_MEMBER, Role.RESIDENT, Role.TENANT)
  findOneInvoice(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.maintenanceService.findOneInvoice(this.sid(user), id);
  }

  @Patch('invoices/:id/waive')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT)
  waiveInvoice(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: WaiveInvoiceDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.maintenanceService.waiveInvoice(this.sid(user), id, dto);
  }
}
