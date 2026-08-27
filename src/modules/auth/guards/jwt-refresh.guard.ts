import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Refresh Guard — protects the /auth/refresh endpoint.
 * Uses the 'jwt-refresh' Passport strategy (JWT_REFRESH_SECRET).
 */
@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
