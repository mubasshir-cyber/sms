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
import { VehiclesService } from './vehicles.service';
import {
  RegisterVehicleDto,
  UpdateVehicleDto,
  VerifyVehicleDto,
  VehicleQueryDto,
} from './dto/vehicle.dto';
import {
  CreateParkingSlotDto,
  BulkCreateSlotsDto,
  UpdateParkingSlotDto,
  AllocateSlotDto,
  CreateTransferRequestDto,
  ActionTransferDto,
  AssignVisitorParkingDto,
  ParkingSlotQueryDto,
} from './dto/parking.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, ADMIN_ROLES, RESIDENT_ROLES } from '../../common/enums/role.enum';
import { TransferStatus } from '../../common/enums/vehicle-parking.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

@ApiTags('Vehicles & Parking')
@ApiBearerAuth('JWT-auth')
@Controller()
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // 🚗 VEHICLES
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('vehicles')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.FACILITY_MANAGER,
    Role.RESIDENT,
    Role.TENANT,
  )
  @ApiOperation({ summary: 'Register a vehicle (Resident or Admin)' })
  @ApiResponse({ status: 201, description: 'Vehicle registered successfully' })
  async registerVehicle(
    @CurrentUser() user: AuthUser,
    @Body() dto: RegisterVehicleDto,
  ) {
    return this.vehiclesService.registerVehicle(user, dto);
  }

  @Get('vehicles')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.FACILITY_MANAGER,
    Role.COMMITTEE_MEMBER,
    Role.SECURITY_GUARD,
    Role.RESIDENT,
    Role.TENANT,
  )
  @ApiOperation({ summary: 'List vehicles (scoped to own unit for residents)' })
  async findVehicles(
    @CurrentUser() user: AuthUser,
    @Query() query: VehicleQueryDto,
  ) {
    return this.vehiclesService.findVehicles(user, query);
  }

  @Get('vehicles/lookup/:identifier')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.FACILITY_MANAGER,
    Role.COMMITTEE_MEMBER,
    Role.SECURITY_GUARD,
  )
  @ApiOperation({ summary: 'Lookup vehicle by registration plate, RFID tag, or Fastag (Gate security)' })
  async lookupVehicle(
    @CurrentUser() user: AuthUser,
    @Param('identifier') identifier: string,
  ) {
    return this.vehiclesService.lookupVehicle(user, identifier);
  }

  @Get('vehicles/:id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.FACILITY_MANAGER,
    Role.COMMITTEE_MEMBER,
    Role.SECURITY_GUARD,
    Role.RESIDENT,
    Role.TENANT,
  )
  @ApiOperation({ summary: 'Get vehicle by UUID' })
  async findVehicleById(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.vehiclesService.findVehicleById(user, id);
  }

  @Patch('vehicles/:id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.FACILITY_MANAGER,
    Role.RESIDENT,
    Role.TENANT,
  )
  @ApiOperation({ summary: 'Update vehicle details' })
  async updateVehicle(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.updateVehicle(user, id, dto);
  }

  @Patch('vehicles/:id/verify')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @ApiOperation({ summary: 'Verify or reject vehicle registration documents (Admin only)' })
  async verifyVehicle(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyVehicleDto,
  ) {
    return this.vehiclesService.verifyVehicle(user, id, dto);
  }

  @Delete('vehicles/:id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.FACILITY_MANAGER,
    Role.RESIDENT,
    Role.TENANT,
  )
  @ApiOperation({ summary: 'Deactivate / delete vehicle' })
  async deleteVehicle(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.vehiclesService.deleteVehicle(user, id);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🅿️ PARKING SLOTS
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('parking/slots')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @ApiOperation({ summary: 'Create a single parking slot' })
  @ApiResponse({ status: 201, description: 'Slot created successfully' })
  async createSlot(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateParkingSlotDto,
  ) {
    return this.vehiclesService.createSlot(user, dto);
  }

  @Post('parking/slots/bulk')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @ApiOperation({ summary: 'Bulk create parking slots (e.g. B1-1 to B1-50)' })
  async bulkCreateSlots(
    @CurrentUser() user: AuthUser,
    @Body() dto: BulkCreateSlotsDto,
  ) {
    return this.vehiclesService.bulkCreateSlots(user, dto);
  }

  @Get('parking/slots')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.FACILITY_MANAGER,
    Role.COMMITTEE_MEMBER,
    Role.SECURITY_GUARD,
    Role.RESIDENT,
    Role.TENANT,
  )
  @ApiOperation({ summary: 'List parking slots with availability filters' })
  async findSlots(
    @CurrentUser() user: AuthUser,
    @Query() query: ParkingSlotQueryDto,
  ) {
    return this.vehiclesService.findSlots(user, query);
  }

  @Get('parking/slots/:id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.FACILITY_MANAGER,
    Role.COMMITTEE_MEMBER,
    Role.SECURITY_GUARD,
    Role.RESIDENT,
    Role.TENANT,
  )
  @ApiOperation({ summary: 'Get parking slot details by ID' })
  async findSlotById(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.vehiclesService.findSlotById(user, id);
  }

  @Patch('parking/slots/:id')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @ApiOperation({ summary: 'Update parking slot' })
  async updateSlot(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateParkingSlotDto,
  ) {
    return this.vehiclesService.updateSlot(user, id, dto);
  }

  @Delete('parking/slots/:id')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @ApiOperation({ summary: 'Delete parking slot' })
  async deleteSlot(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.vehiclesService.deleteSlot(user, id);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📋 ALLOCATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('parking/allocations')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @ApiOperation({ summary: 'Allocate parking slot to a unit/vehicle' })
  @ApiResponse({ status: 201, description: 'Slot allocated successfully' })
  async allocateSlot(
    @CurrentUser() user: AuthUser,
    @Body() dto: AllocateSlotDto,
  ) {
    return this.vehiclesService.allocateSlot(user, dto);
  }

  @Get('parking/allocations')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.FACILITY_MANAGER,
    Role.COMMITTEE_MEMBER,
    Role.RESIDENT,
    Role.TENANT,
  )
  @ApiOperation({ summary: 'List parking allocations (scoped to unit for residents)' })
  async findAllocations(
    @CurrentUser() user: AuthUser,
    @Query('unitId') unitId?: string,
  ) {
    return this.vehiclesService.findAllocations(user, unitId);
  }

  @Patch('parking/allocations/:id/release')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @ApiOperation({ summary: 'Release parking allocation and mark slot available' })
  async releaseAllocation(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.vehiclesService.releaseAllocation(user, id);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔄 TRANSFERS
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('parking/transfers')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.FACILITY_MANAGER,
    Role.RESIDENT,
    Role.TENANT,
  )
  @ApiOperation({ summary: 'Request transfer of an allocated parking slot to another unit' })
  @ApiResponse({ status: 201, description: 'Transfer request created' })
  async requestTransfer(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateTransferRequestDto,
  ) {
    return this.vehiclesService.requestTransfer(user, dto);
  }

  @Get('parking/transfers')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.FACILITY_MANAGER,
    Role.COMMITTEE_MEMBER,
    Role.RESIDENT,
    Role.TENANT,
  )
  @ApiOperation({ summary: 'List parking transfer requests' })
  async findTransfers(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: TransferStatus,
  ) {
    return this.vehiclesService.findTransfers(user, status);
  }

  @Patch('parking/transfers/:id/action')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @ApiOperation({ summary: 'Approve or reject a parking transfer request' })
  async actionTransfer(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActionTransferDto,
  ) {
    return this.vehiclesService.actionTransfer(user, id, dto);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🚖 VISITOR PARKING
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('parking/visitor/assign')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.FACILITY_MANAGER,
    Role.SECURITY_GUARD,
  )
  @ApiOperation({ summary: 'Assign visitor parking slot at gate (Guard / Admin)' })
  @ApiResponse({ status: 201, description: 'Visitor parking slot assigned' })
  async assignVisitorParking(
    @CurrentUser() user: AuthUser,
    @Body() dto: AssignVisitorParkingDto,
  ) {
    return this.vehiclesService.assignVisitorParking(user, dto);
  }

  @Patch('parking/visitor/:slotId/release')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.FACILITY_MANAGER,
    Role.SECURITY_GUARD,
  )
  @ApiOperation({ summary: 'Release visitor parking slot upon exit' })
  async releaseVisitorParking(
    @CurrentUser() user: AuthUser,
    @Param('slotId', ParseUUIDPipe) slotId: string,
  ) {
    return this.vehiclesService.releaseVisitorParking(user, slotId);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📊 ANALYTICS
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('parking/analytics')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.FACILITY_MANAGER,
    Role.COMMITTEE_MEMBER,
  )
  @ApiOperation({ summary: 'Get parking availability and vehicle registration analytics' })
  async getParkingAnalytics(@CurrentUser() user: AuthUser) {
    return this.vehiclesService.getParkingAnalytics(user);
  }
}
