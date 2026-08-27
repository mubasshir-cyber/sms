import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '../interfaces/auth-user.interface';

/**
 * Parameter decorator to extract the authenticated user from the request.
 * Populated by JwtStrategy after token validation.
 *
 * @example
 * @Get('profile')
 * getProfile(@CurrentUser() user: AuthUser) {
 *   return this.usersService.findById(user.sub);
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext): AuthUser | unknown => {
    const request = ctx.switchToHttp().getRequest();
    const user: AuthUser = request.user;
    return data ? user?.[data] : user;
  },
);
