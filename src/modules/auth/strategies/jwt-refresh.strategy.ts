import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import type { AuthUser } from '../../../common/interfaces/auth-user.interface';

interface JwtRefreshPayload extends AuthUser {
  refreshToken: string;
}

/**
 * JWT Refresh Strategy — validates refresh tokens for the /auth/refresh endpoint.
 *
 * Reads the Bearer token from Authorization header,
 * verifies with JWT_REFRESH_SECRET, and attaches payload + raw token
 * to request.user so AuthService can validate against DB.
 *
 * Used by JwtRefreshGuard via @AuthGuard('jwt-refresh').
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: AuthUser): JwtRefreshPayload {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('No refresh token provided');
    }
    const refreshToken = authHeader.replace('Bearer ', '').trim();
    return { ...payload, refreshToken };
  }
}
