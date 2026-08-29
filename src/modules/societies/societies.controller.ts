import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { SocietiesService } from './societies.service';
import { CreateSocietyDto } from './dto/create-society.dto';
import { UpdateSocietyDto } from './dto/update-society.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

/**
 * Societies Controller — manages housing society profiles.
 *
 * Routes:
 *   GET    /api/v1/societies            → List all (SUPER_ADMIN) or own society
 *   GET    /api/v1/societies/:id        → Get a specific society
 *   POST   /api/v1/societies            → Create a new society (SUPER_ADMIN / SOCIETY_ADMIN)
 *   PATCH  /api/v1/societies/:id        → Update society (SUPER_ADMIN / SOCIETY_ADMIN)
 *   DELETE /api/v1/societies/:id        → Soft-delete (SUPER_ADMIN only)
 */
@Controller('societies')
export class SocietiesController {
  constructor(private readonly societiesService: SocietiesService) {}

  /**
   * POST /api/v1/societies
   * Create a new society. Must belong to an existing tenant.
   */
  @Post()
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateSocietyDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.societiesService.create(dto, user);
  }

  /**
   * GET /api/v1/societies
   * SUPER_ADMIN: returns all societies.
   * Others: returns only their own society.
   */
  @Get()
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.COMMITTEE_MEMBER,
    Role.ACCOUNTANT,
    Role.FACILITY_MANAGER,
  )
  findAll(@CurrentUser() user: AuthUser) {
    return this.societiesService.findAll(user);
  }

  /**
   * GET /api/v1/societies/:id
   * Fetch a specific society — access scoped by role.
   */
  @Get(':id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.COMMITTEE_MEMBER,
    Role.ACCOUNTANT,
    Role.FACILITY_MANAGER,
  )
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.societiesService.findOne(id, user);
  }

  /**
   * PATCH /api/v1/societies/:id
   * Update society profile, contact info, settings, or status.
   */
  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSocietyDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.societiesService.update(id, dto, user);
  }

  /**
   * DELETE /api/v1/societies/:id
   * Soft-delete a society. Data is preserved. SUPER_ADMIN only.
   */
  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.societiesService.remove(id, user);
  }
}
