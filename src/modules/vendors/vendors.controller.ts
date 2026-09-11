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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { VendorsService } from './vendors.service';
import {
  CreateVendorDto,
  UpdateVendorDto,
  VendorQueryDto,
  CreateVendorContractDto,
  UpdateVendorContractDto,
  ContractQueryDto,
  CreateAmcScheduleDto,
  UpdateAmcScheduleDto,
  CompleteAmcVisitDto,
  CreateVendorInvoiceDto,
  ApproveVendorInvoiceDto,
  RecordVendorPaymentDto,
  CreateVendorReviewDto,
} from './dto/vendors.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { VendorInvoiceStatus } from '../../common/enums/vendor.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

@ApiTags('Vendors & Contracts')
@ApiBearerAuth('JWT-auth')
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏢 VENDOR PROFILES
  // ═══════════════════════════════════════════════════════════════════════════

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new vendor in the society' })
  @ApiResponse({ status: 201, description: 'Vendor created successfully' })
  async createVendor(@CurrentUser() user: AuthUser, @Body() dto: CreateVendorDto) {
    return this.vendorsService.createVendor(user, dto);
  }

  @Get()
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.COMMITTEE_MEMBER,
    Role.ACCOUNTANT,
    Role.FACILITY_MANAGER,
    Role.VENDOR,
  )
  @ApiOperation({ summary: 'List vendors for society with category/status filters' })
  async findAllVendors(@CurrentUser() user: AuthUser, @Query() query: VendorQueryDto) {
    return this.vendorsService.findAllVendors(user, query);
  }

  @Get(':id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.COMMITTEE_MEMBER,
    Role.ACCOUNTANT,
    Role.FACILITY_MANAGER,
    Role.VENDOR,
  )
  @ApiOperation({ summary: 'Get vendor profile with contracts and invoice overview' })
  async findVendorById(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.vendorsService.findVendorById(user, id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @ApiOperation({ summary: 'Update vendor profile' })
  async updateVendor(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVendorDto,
  ) {
    return this.vendorsService.updateVendor(user, id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @ApiOperation({ summary: 'Soft delete a vendor' })
  async deleteVendor(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.vendorsService.deleteVendor(user, id);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📜 CONTRACTS & AMC
  // ═══════════════════════════════════════════════════════════════════════════

  @Post(':vendorId/contracts')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new service contract or AMC for a vendor' })
  async createContract(
    @CurrentUser() user: AuthUser,
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Body() dto: CreateVendorContractDto,
  ) {
    return this.vendorsService.createContract(user, vendorId, dto);
  }

  @Get(':vendorId/contracts')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.COMMITTEE_MEMBER,
    Role.ACCOUNTANT,
    Role.FACILITY_MANAGER,
    Role.VENDOR,
  )
  @ApiOperation({ summary: 'List contracts for a specific vendor' })
  async findAllContracts(
    @CurrentUser() user: AuthUser,
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Query() query: ContractQueryDto,
  ) {
    return this.vendorsService.findAllContracts(user, vendorId, query);
  }

  @Get('contracts/:id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.COMMITTEE_MEMBER,
    Role.ACCOUNTANT,
    Role.FACILITY_MANAGER,
    Role.VENDOR,
  )
  @ApiOperation({ summary: 'Get contract details with AMC schedules and invoices' })
  async findContractById(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.vendorsService.findContractById(user, id);
  }

  @Patch('contracts/:id')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @ApiOperation({ summary: 'Update contract details' })
  async updateContract(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVendorContractDto,
  ) {
    return this.vendorsService.updateContract(user, id, dto);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔧 AMC SCHEDULES
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('contracts/:contractId/amc-schedules')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Schedule a routine AMC maintenance visit' })
  async createAmcSchedule(
    @CurrentUser() user: AuthUser,
    @Param('contractId', ParseUUIDPipe) contractId: string,
    @Body() dto: CreateAmcScheduleDto,
  ) {
    return this.vendorsService.createAmcSchedule(user, contractId, dto);
  }

  @Get('contracts/:contractId/amc-schedules')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.COMMITTEE_MEMBER,
    Role.FACILITY_MANAGER,
    Role.VENDOR,
  )
  @ApiOperation({ summary: 'List AMC schedules for a contract' })
  async findAllAmcSchedules(
    @CurrentUser() user: AuthUser,
    @Param('contractId', ParseUUIDPipe) contractId: string,
  ) {
    return this.vendorsService.findAllAmcSchedules(user, contractId);
  }

  @Patch('amc-schedules/:id/complete')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER, Role.VENDOR)
  @ApiOperation({ summary: 'Complete an AMC visit and upload service report' })
  async completeAmcVisit(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteAmcVisitDto,
  ) {
    return this.vendorsService.completeAmcVisit(user, id, dto);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🧾 INVOICES & PAYMENTS
  // ═══════════════════════════════════════════════════════════════════════════

  @Post(':vendorId/invoices')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.ACCOUNTANT,
    Role.FACILITY_MANAGER,
    Role.VENDOR,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record an invoice received from a vendor' })
  async createInvoice(
    @CurrentUser() user: AuthUser,
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Body() dto: CreateVendorInvoiceDto,
  ) {
    return this.vendorsService.createInvoice(user, vendorId, dto);
  }

  @Get('invoices/list')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.COMMITTEE_MEMBER,
    Role.ACCOUNTANT,
    Role.FACILITY_MANAGER,
    Role.VENDOR,
  )
  @ApiOperation({ summary: 'List vendor invoices with payment status filters' })
  @ApiQuery({ name: 'status', enum: VendorInvoiceStatus, required: false })
  @ApiQuery({ name: 'vendorId', required: false })
  async findAllInvoices(
    @CurrentUser() user: AuthUser,
    @Query('vendorId') vendorId?: string,
    @Query('status') status?: VendorInvoiceStatus,
  ) {
    return this.vendorsService.findAllInvoices(user, vendorId, status);
  }

  @Get('invoices/:id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.COMMITTEE_MEMBER,
    Role.ACCOUNTANT,
    Role.FACILITY_MANAGER,
    Role.VENDOR,
  )
  @ApiOperation({ summary: 'Get invoice details' })
  async findInvoiceById(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.vendorsService.findInvoiceById(user, id);
  }

  @Patch('invoices/:id/approve')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Approve vendor invoice for payment' })
  async approveInvoice(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveVendorInvoiceDto,
  ) {
    return this.vendorsService.approveInvoice(user, id, dto);
  }

  @Post('invoices/:id/pay')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Record payment for a vendor invoice' })
  async recordPayment(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordVendorPaymentDto,
  ) {
    return this.vendorsService.recordPayment(user, id, dto);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ REVIEWS & PERFORMANCE
  // ═══════════════════════════════════════════════════════════════════════════

  @Post(':vendorId/reviews')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.COMMITTEE_MEMBER, Role.FACILITY_MANAGER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a performance review & rating for a vendor' })
  async createReview(
    @CurrentUser() user: AuthUser,
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Body() dto: CreateVendorReviewDto,
  ) {
    return this.vendorsService.createReview(user, vendorId, dto);
  }

  @Get(':vendorId/reviews')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.COMMITTEE_MEMBER,
    Role.ACCOUNTANT,
    Role.FACILITY_MANAGER,
    Role.VENDOR,
  )
  @ApiOperation({ summary: 'List reviews and ratings for a vendor' })
  async findReviews(
    @CurrentUser() user: AuthUser,
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
  ) {
    return this.vendorsService.findReviews(user, vendorId);
  }
}
