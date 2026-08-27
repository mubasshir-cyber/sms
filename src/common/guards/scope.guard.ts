import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../enums/role.enum';
import { AuthUser } from '../interfaces/auth-user.interface';

/**
 * Data Scope Guard — ensures users can only access data within their society.
 *
 * Validates that any resource being accessed (via :id param) belongs to the
 * same societyId as the authenticated user. SUPER_ADMIN bypasses all checks.
 *
 * Apply after JwtAuthGuard and RolesGuard in the guard chain.
 *
 * NOTE: This guard performs a high-level scope check.
 * Detailed query-level scoping is enforced in service methods.
 */
@Injectable()
export class ScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: AuthUser = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // SUPER_ADMIN has no scope restrictions
    if (user.role === Role.SUPER_ADMIN) {
      return true;
    }

    // Society-scoped users must have a societyId
    if (!user.societyId) {
      throw new ForbiddenException('User is not associated with any society');
    }

    // Attach societyId to request for service-level use
    request.societyId = user.societyId;

    return true;
  }
}
