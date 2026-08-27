import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthUser } from '../../../common/interfaces/auth-user.interface';

/**
 * JWT Strategy — validates access tokens on every protected request.
 *
 * Reads the Bearer token from Authorization header,
 * verifies signature with JWT_SECRET, and attaches the decoded
 * payload as `request.user` (AuthUser interface).
 *
 * Used by JwtAuthGuard via @AuthGuard('jwt').
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * Called after the token is verified.
   * Return value is set as request.user.
   */
  validate(payload: AuthUser): AuthUser {
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      societyId: payload.societyId,
      unitId: payload.unitId ?? null,
      gateId: payload.gateId ?? null,
      vendorId: payload.vendorId ?? null,
      iat: payload.iat,
      exp: payload.exp,
    };
  }
}
