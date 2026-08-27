import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Get,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

/**
 * Auth Controller — handles all authentication flows.
 * All routes except /me are marked @Public() or use JwtRefreshGuard.
 *
 * Routes:
 *   POST /api/v1/auth/register    → Create account + get tokens
 *   POST /api/v1/auth/login       → Get access + refresh tokens
 *   POST /api/v1/auth/refresh     → Exchange refresh token for new token pair
 *   POST /api/v1/auth/logout      → Revoke refresh token(s)
 *   GET  /api/v1/auth/me          → Get current user profile
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/v1/auth/register
   * Public — creates a new resident/tenant account and issues tokens.
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto): Promise<object> {
    return this.authService.register(dto);
  }

  /**
   * POST /api/v1/auth/login
   * Public — validates credentials and issues access + refresh tokens.
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Req() req: Request): Promise<object> {
    const ipAddress = (req.headers['x-forwarded-for'] as string) ?? req.socket?.remoteAddress;
    const deviceInfo = req.headers['user-agent'];
    return this.authService.login(dto, ipAddress, deviceInfo);
  }

  /**
   * POST /api/v1/auth/refresh
   * Uses JwtRefreshGuard (JWT_REFRESH_SECRET) — exchanges refresh token for new pair.
   */
  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(
    @CurrentUser() user: AuthUser,
    @Body() _dto: RefreshTokenDto,
    @Req() req: Request,
  ): Promise<object> {
    const authHeader = req.headers.authorization ?? '';
    const rawRefreshToken = authHeader.replace('Bearer ', '');
    return this.authService.refreshTokens(user.sub, rawRefreshToken);
  }

  /**
   * POST /api/v1/auth/logout
   * Authenticated — revokes refresh token. Optionally revokes all sessions.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: AuthUser,
    @Body() dto: RefreshTokenDto,
  ): Promise<{ message: string }> {
    await this.authService.logout(user.sub, dto.refreshToken);
    return { message: 'Logged out successfully' };
  }

  /**
   * POST /api/v1/auth/logout-all
   * Authenticated — revokes ALL refresh tokens for the current user (all devices).
   */
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(@CurrentUser() user: AuthUser): Promise<{ message: string }> {
    await this.authService.logout(user.sub);
    return { message: 'Logged out from all devices' };
  }

  /**
   * GET /api/v1/auth/me
   * Authenticated — returns the current user's decoded JWT payload.
   */
  @Get('me')
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }
}
