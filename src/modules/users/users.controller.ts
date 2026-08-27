import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ScopeGuard } from '../../common/guards/scope.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { Role } from '../../common/enums/role.enum';

/**
 * Users Controller — manages user accounts.
 * All routes require JWT authentication + RBAC enforcement.
 */
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * POST /api/v1/users
   * Create a new user — admin only.
   */
  @Post()
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.create(createUserDto, user);
  }

  /**
   * GET /api/v1/users
   * List all users — scoped to society (except SUPER_ADMIN).
   */
  @Get()
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.COMMITTEE_MEMBER)
  findAll(@CurrentUser() user: AuthUser) {
    return this.usersService.findAll(user);
  }

  /**
   * GET /api/v1/users/me
   * Get the currently authenticated user's profile.
   */
  @Get('me')
  getMe(@CurrentUser() user: AuthUser) {
    return this.usersService.findOne(user.sub, user);
  }

  /**
   * GET /api/v1/users/:id
   * Get a specific user by ID.
   */
  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN)
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.findOne(id, user);
  }

  /**
   * PATCH /api/v1/users/:id
   * Update a user — admin only.
   */
  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.update(id, updateUserDto, user);
  }

  /**
   * DELETE /api/v1/users/:id
   * Soft-delete a user — admin only.
   */
  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.remove(id, user);
  }
}
