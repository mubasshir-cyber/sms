import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route as public — skips JWT authentication.
 * Use only for routes that must be accessible without a token
 * (e.g., login, register, health check).
 *
 * @example
 * @Public()
 * @Post('login')
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
