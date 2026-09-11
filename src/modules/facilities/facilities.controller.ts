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
import { FacilitiesService } from './facilities.service';
import {
  CreateFacilityDto,
  UpdateFacilityDto,
  FacilityQueryDto,
} from './dto/facility.dto';
import {
  CreateBookingDto,
  ActionBookingDto,
  CancelBookingDto,
  BookingQueryDto,
  AvailabilityQueryDto,
} from './dto/booking.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

@ApiTags('Facilities & Amenity Bookings')
@ApiBearerAuth('JWT-auth')
@Controller()
export class FacilitiesController {
  constructor(private readonly facilitiesService: FacilitiesService) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏛️ FACILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('facilities')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @ApiOperation({ summary: 'Create a new bookable facility / amenity (Admin)' })
  @ApiResponse({ status: 201, description: 'Facility created successfully' })
  async createFacility(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateFacilityDto,
  ) {
    return this.facilitiesService.createFacility(user, dto);
  }

  @Get('facilities')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.FACILITY_MANAGER,
    Role.COMMITTEE_MEMBER,
    Role.ACCOUNTANT,
    Role.SECURITY_GUARD,
    Role.RESIDENT,
    Role.TENANT,
  )
  @ApiOperation({ summary: 'List facilities and amenities' })
  async findFacilities(
    @CurrentUser() user: AuthUser,
    @Query() query: FacilityQueryDto,
  ) {
    return this.facilitiesService.findFacilities(user, query);
  }

  @Get('facilities/:id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.FACILITY_MANAGER,
    Role.COMMITTEE_MEMBER,
    Role.ACCOUNTANT,
    Role.SECURITY_GUARD,
    Role.RESIDENT,
    Role.TENANT,
  )
  @ApiOperation({ summary: 'Get facility details by ID' })
  async findFacilityById(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.facilitiesService.findFacilityById(user, id);
  }

  @Patch('facilities/:id')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @ApiOperation({ summary: 'Update facility configuration (Admin)' })
  async updateFacility(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFacilityDto,
  ) {
    return this.facilitiesService.updateFacility(user, id, dto);
  }

  @Delete('facilities/:id')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.FACILITY_MANAGER)
  @ApiOperation({ summary: 'Soft delete facility (Admin)' })
  async deleteFacility(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.facilitiesService.deleteFacility(user, id);
  }

  @Get('facilities/:id/availability')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.FACILITY_MANAGER,
    Role.COMMITTEE_MEMBER,
    Role.RESIDENT,
    Role.TENANT,
  )
  @ApiOperation({ summary: 'Check real-time slot availability for a facility on a specific date' })
  async checkAvailability(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: AvailabilityQueryDto,
  ) {
    return this.facilitiesService.checkAvailability(user, id, query.date);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📝 BOOKINGS
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('bookings')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.FACILITY_MANAGER,
    Role.COMMITTEE_MEMBER,
    Role.RESIDENT,
    Role.TENANT,
  )
  @ApiOperation({ summary: 'Create an amenity booking (Resident or Admin)' })
  @ApiResponse({ status: 201, description: 'Booking created successfully' })
  async createBooking(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateBookingDto,
  ) {
    return this.facilitiesService.createBooking(user, dto);
  }

  @Get('bookings')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.FACILITY_MANAGER,
    Role.COMMITTEE_MEMBER,
    Role.RESIDENT,
    Role.TENANT,
  )
  @ApiOperation({ summary: 'List bookings (scoped to resident own bookings)' })
  async findBookings(
    @CurrentUser() user: AuthUser,
    @Query() query: BookingQueryDto,
  ) {
    return this.facilitiesService.findBookings(user, query);
  }

  @Get('bookings/analytics')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.FACILITY_MANAGER,
    Role.COMMITTEE_MEMBER,
  )
  @ApiOperation({ summary: 'Get facility booking usage and revenue analytics' })
  async getBookingAnalytics(@CurrentUser() user: AuthUser) {
    return this.facilitiesService.getBookingAnalytics(user);
  }

  @Get('bookings/:id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.FACILITY_MANAGER,
    Role.COMMITTEE_MEMBER,
    Role.RESIDENT,
    Role.TENANT,
  )
  @ApiOperation({ summary: 'Get booking details by ID' })
  async findBookingById(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.facilitiesService.findBookingById(user, id);
  }

  @Get('bookings/:id/history')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.FACILITY_MANAGER,
    Role.COMMITTEE_MEMBER,
    Role.RESIDENT,
    Role.TENANT,
  )
  @ApiOperation({ summary: 'Get audit history trail of status transitions for a booking' })
  async getBookingHistory(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.facilitiesService.getBookingHistory(user, id);
  }

  @Patch('bookings/:id/action')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.FACILITY_MANAGER,
    Role.COMMITTEE_MEMBER,
  )
  @ApiOperation({ summary: 'Approve or reject a pending booking request (Admin/Committee)' })
  async actionBooking(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActionBookingDto,
  ) {
    return this.facilitiesService.actionBooking(user, id, dto);
  }

  @Patch('bookings/:id/cancel')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.FACILITY_MANAGER,
    Role.RESIDENT,
    Role.TENANT,
  )
  @ApiOperation({ summary: 'Cancel a booking (subject to cancellation cut-off policy)' })
  async cancelBooking(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelBookingDto,
  ) {
    return this.facilitiesService.cancelBooking(user, id, dto);
  }
}
