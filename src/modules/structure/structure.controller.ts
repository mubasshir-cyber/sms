import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  HttpCode, HttpStatus, ParseUUIDPipe, Query,
  UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StructureService } from './structure.service';
import { CreateTowerDto, UpdateTowerDto } from './dto/tower.dto';
import { CreateFloorDto, UpdateFloorDto } from './dto/floor.dto';
import { CreateUnitDto, UpdateUnitDto } from './dto/unit.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

/**
 * Structure Controller — towers, floors, units nested under a society.
 * Base path: /api/v1/societies/:societyId/...
 */
@Controller('societies/:societyId')
export class StructureController {
  constructor(private readonly structureService: StructureService) {}

  private getSocietyId(param: string, user: AuthUser): string {
    // Non-SUPER_ADMIN can only access their own society
    if (user.role !== Role.SUPER_ADMIN && user.societyId !== param) {
      throw new BadRequestException('Access denied to this society');
    }
    return param;
  }

  // ─── Towers ──────────────────────────────────────────────────────────────

  @Post('towers')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  createTower(
    @Param('societyId', ParseUUIDPipe) societyId: string,
    @Body() dto: CreateTowerDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.structureService.createTower(this.getSocietyId(societyId, user), dto);
  }

  @Get('towers')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.COMMITTEE_MEMBER, Role.ACCOUNTANT, Role.FACILITY_MANAGER, Role.RESIDENT, Role.TENANT)
  findAllTowers(
    @Param('societyId', ParseUUIDPipe) societyId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.structureService.findAllTowers(this.getSocietyId(societyId, user));
  }

  @Patch('towers/:towerId')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN)
  updateTower(
    @Param('societyId', ParseUUIDPipe) societyId: string,
    @Param('towerId', ParseUUIDPipe) towerId: string,
    @Body() dto: UpdateTowerDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.structureService.updateTower(this.getSocietyId(societyId, user), towerId, dto);
  }

  @Delete('towers/:towerId')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeTower(
    @Param('societyId', ParseUUIDPipe) societyId: string,
    @Param('towerId', ParseUUIDPipe) towerId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.structureService.removeTower(this.getSocietyId(societyId, user), towerId);
  }

  // ─── Floors ──────────────────────────────────────────────────────────────

  @Post('floors')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  createFloor(
    @Param('societyId', ParseUUIDPipe) societyId: string,
    @Body() dto: CreateFloorDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.structureService.createFloor(this.getSocietyId(societyId, user), dto);
  }

  @Get('floors')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.COMMITTEE_MEMBER, Role.ACCOUNTANT, Role.FACILITY_MANAGER)
  findAllFloors(
    @Param('societyId', ParseUUIDPipe) societyId: string,
    @Query('towerId') towerId: string | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    return this.structureService.findAllFloors(this.getSocietyId(societyId, user), towerId);
  }

  @Patch('floors/:floorId')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN)
  updateFloor(
    @Param('societyId', ParseUUIDPipe) societyId: string,
    @Param('floorId', ParseUUIDPipe) floorId: string,
    @Body() dto: UpdateFloorDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.structureService.updateFloor(this.getSocietyId(societyId, user), floorId, dto);
  }

  // ─── Units ───────────────────────────────────────────────────────────────

  @Post('units')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  createUnit(
    @Param('societyId', ParseUUIDPipe) societyId: string,
    @Body() dto: CreateUnitDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.structureService.createUnit(this.getSocietyId(societyId, user), dto);
  }

  @Get('units')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.COMMITTEE_MEMBER, Role.ACCOUNTANT, Role.FACILITY_MANAGER, Role.RESIDENT, Role.TENANT)
  findAllUnits(
    @Param('societyId', ParseUUIDPipe) societyId: string,
    @Query('towerId') towerId: string | undefined,
    @Query('status') status: string | undefined,
    @Query('type') type: string | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    return this.structureService.findAllUnits(
      this.getSocietyId(societyId, user),
      { towerId, status, type },
    );
  }

  @Get('units/:unitId')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.COMMITTEE_MEMBER, Role.ACCOUNTANT, Role.FACILITY_MANAGER, Role.RESIDENT, Role.TENANT)
  findOneUnit(
    @Param('societyId', ParseUUIDPipe) societyId: string,
    @Param('unitId', ParseUUIDPipe) unitId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.structureService.findOneUnit(this.getSocietyId(societyId, user), unitId);
  }

  @Patch('units/:unitId')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN)
  updateUnit(
    @Param('societyId', ParseUUIDPipe) societyId: string,
    @Param('unitId', ParseUUIDPipe) unitId: string,
    @Body() dto: UpdateUnitDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.structureService.updateUnit(this.getSocietyId(societyId, user), unitId, dto);
  }

  @Delete('units/:unitId')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeUnit(
    @Param('societyId', ParseUUIDPipe) societyId: string,
    @Param('unitId', ParseUUIDPipe) unitId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.structureService.removeUnit(this.getSocietyId(societyId, user), unitId);
  }

  @Post('units/import')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  importUnits(
    @Param('societyId', ParseUUIDPipe) societyId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthUser,
  ) {
    if (!file) throw new BadRequestException('CSV file is required');
    if (!file.originalname.endsWith('.csv')) {
      throw new BadRequestException('Only .csv files are accepted');
    }
    return this.structureService.bulkImportUnits(this.getSocietyId(societyId, user), file.buffer);
  }
}
