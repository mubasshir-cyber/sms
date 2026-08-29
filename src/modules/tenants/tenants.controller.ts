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
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

/**
 * Tenants Controller — platform-level tenant management.
 * ALL routes are restricted to SUPER_ADMIN only.
 *
 * Routes:
 *   GET    /api/v1/tenants              → List all tenants
 *   GET    /api/v1/tenants/:id          → Get a specific tenant
 *   POST   /api/v1/tenants              → Create a new tenant
 *   PATCH  /api/v1/tenants/:id          → Update a tenant
 *   DELETE /api/v1/tenants/:id          → Soft-delete a tenant
 */
@Controller('tenants')
@Roles(Role.SUPER_ADMIN)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  /**
   * POST /api/v1/tenants
   * Create a new tenant (platform customer / society operator).
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  /**
   * GET /api/v1/tenants
   * List all tenants on the platform.
   */
  @Get()
  findAll() {
    return this.tenantsService.findAll();
  }

  /**
   * GET /api/v1/tenants/:id
   * Get a tenant by UUID.
   */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.findOne(id);
  }

  /**
   * PATCH /api/v1/tenants/:id
   * Update tenant details (plan, contact info, status, etc.)
   */
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.tenantsService.update(id, dto);
  }

  /**
   * DELETE /api/v1/tenants/:id
   * Soft-delete a tenant. Their societies and data are preserved.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.remove(id);
  }
}
