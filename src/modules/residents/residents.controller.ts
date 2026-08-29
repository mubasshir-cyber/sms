import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  HttpCode, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common';
import { ResidentsService } from './residents.service';
import {
  CreateResidentDto, UpdateResidentDto,
  CreateFamilyMemberDto, UpdateFamilyMemberDto,
} from './dto/resident.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

@Controller('residents')
export class ResidentsController {
  constructor(private readonly residentsService: ResidentsService) {}

  private resolveSocietyId(user: AuthUser): string {
    return user.societyId as string;
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateResidentDto, @CurrentUser() user: AuthUser) {
    return this.residentsService.create(this.resolveSocietyId(user), dto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.COMMITTEE_MEMBER, Role.ACCOUNTANT, Role.FACILITY_MANAGER)
  findAll(@CurrentUser() user: AuthUser) {
    return this.residentsService.findAll(this.resolveSocietyId(user));
  }

  @Get('directory')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.COMMITTEE_MEMBER, Role.RESIDENT, Role.TENANT)
  getDirectory(@CurrentUser() user: AuthUser) {
    return this.residentsService.getDirectory(this.resolveSocietyId(user));
  }

  @Get('unit/:unitId')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.COMMITTEE_MEMBER, Role.ACCOUNTANT)
  findByUnit(
    @Param('unitId', ParseUUIDPipe) unitId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.residentsService.findByUnit(this.resolveSocietyId(user), unitId);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.COMMITTEE_MEMBER, Role.ACCOUNTANT)
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.residentsService.findOne(this.resolveSocietyId(user), id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateResidentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.residentsService.update(this.resolveSocietyId(user), id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.residentsService.remove(this.resolveSocietyId(user), id);
  }

  // ─── Family Members ───────────────────────────────────────────────────────

  @Post(':id/family')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.RESIDENT)
  @HttpCode(HttpStatus.CREATED)
  addFamily(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateFamilyMemberDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.residentsService.addFamilyMember(this.resolveSocietyId(user), id, dto);
  }

  @Get(':id/family')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.COMMITTEE_MEMBER, Role.RESIDENT)
  getFamily(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.residentsService.findFamilyMembers(this.resolveSocietyId(user), id);
  }

  @Patch(':id/family/:memberId')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.RESIDENT)
  updateFamily(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() dto: UpdateFamilyMemberDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.residentsService.updateFamilyMember(this.resolveSocietyId(user), id, memberId, dto);
  }

  @Delete(':id/family/:memberId')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.RESIDENT)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeFamily(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.residentsService.removeFamilyMember(this.resolveSocietyId(user), id, memberId);
  }
}
