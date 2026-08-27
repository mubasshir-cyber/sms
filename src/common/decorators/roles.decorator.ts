import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export const ROLES_KEY = 'roles';

/**
 * Decorator to restrict route access to specific roles.
 * Must be used alongside RolesGuard.
 *
 * @example
 * @Roles(Role.SOCIETY_ADMIN, Role.ACCOUNTANT)
 * @Get('invoices')
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
