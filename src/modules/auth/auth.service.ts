import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  tokenType: 'Bearer';
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly BCRYPT_ROUNDS = 10;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  // ─── Register ─────────────────────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<TokenPair> {
    // Default role for self-registration is RESIDENT
    const role = dto.role ?? Role.RESIDENT;

    // Self-registration cannot claim elevated roles
    if (
      [Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.ACCOUNTANT, Role.FACILITY_MANAGER].includes(role)
    ) {
      throw new ForbiddenException('Cannot self-register with an elevated role');
    }

    const user = await this.usersService.create(
      { ...dto, role },
      // Fake super admin context — register is public and creates the base user
      { sub: 'system', email: 'system', role: Role.SUPER_ADMIN, societyId: null, iat: 0, exp: 0 },
    );

    this.logger.log(`New user registered: ${user.id} (${role})`);
    return this.generateTokenPair(user.id, user.email, user.role, user.societyId, user.unitId, user.gateId, user.vendorId);
  }

  // ─── Login ────────────────────────────────────────────────────────────────

  async login(dto: LoginDto, ipAddress?: string, deviceInfo?: string): Promise<TokenPair> {
    // findByEmail includes passwordHash (select: false override)
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated. Contact support.');
    }

    if (user.isLocked) {
      throw new UnauthorizedException(
        `Account locked due to too many failed attempts. Try again after ${user.lockedUntil?.toLocaleTimeString()}.`,
      );
    }

    const isPasswordValid = await user.validatePassword(dto.password);

    if (!isPasswordValid) {
      await this.usersService.incrementFailedLogin(user.id);
      throw new UnauthorizedException('Invalid email or password');
    }

    // Reset failed attempts on successful login
    await this.usersService.resetFailedLogin(user.id);

    this.logger.log(`User logged in: ${user.id} (${user.role})`);
    return this.generateTokenPair(
      user.id,
      user.email,
      user.role,
      user.societyId,
      user.unitId,
      user.gateId,
      user.vendorId,
      ipAddress,
      deviceInfo,
    );
  }

  // ─── Refresh Token ────────────────────────────────────────────────────────

  async refreshTokens(userId: string, rawRefreshToken: string): Promise<TokenPair> {
    // Find all active tokens for this user
    const tokens = await this.refreshTokenRepo.find({
      where: { userId, isRevoked: false },
    });

    if (!tokens.length) {
      throw new ForbiddenException('Access denied — no active sessions');
    }

    // Find the matching token by comparing hashes
    let matchedToken: RefreshToken | null = null;
    for (const token of tokens) {
      const matches = await bcrypt.compare(rawRefreshToken, token.tokenHash);
      if (matches) {
        matchedToken = token;
        break;
      }
    }

    if (!matchedToken) {
      throw new ForbiddenException('Invalid refresh token');
    }

    if (matchedToken.isExpired) {
      await this.refreshTokenRepo.update(matchedToken.id, { isRevoked: true });
      throw new ForbiddenException('Refresh token expired — please log in again');
    }

    // Revoke old refresh token (rotation)
    await this.refreshTokenRepo.update(matchedToken.id, { isRevoked: true });

    // Get user info for new token
    const authUser: AuthUser = {
      sub: userId,
      email: '',
      role: Role.RESIDENT,
      societyId: null,
      iat: 0,
      exp: 0,
    };

    // Decode existing access token payload to get user fields
    try {
      const decoded = this.jwtService.decode(rawRefreshToken) as AuthUser;
      authUser.email = decoded.email;
      authUser.role = decoded.role;
      authUser.societyId = decoded.societyId;
      authUser.unitId = decoded.unitId;
      authUser.gateId = decoded.gateId;
      authUser.vendorId = decoded.vendorId;
    } catch {
      throw new ForbiddenException('Invalid token payload');
    }

    this.logger.log(`Token refreshed for user: ${userId}`);
    return this.generateTokenPair(
      userId,
      authUser.email,
      authUser.role,
      authUser.societyId,
      authUser.unitId,
      authUser.gateId,
      authUser.vendorId,
    );
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  async logout(userId: string, rawRefreshToken?: string): Promise<void> {
    if (rawRefreshToken) {
      // Revoke specific token
      const tokens = await this.refreshTokenRepo.find({
        where: { userId, isRevoked: false },
      });
      for (const token of tokens) {
        const matches = await bcrypt.compare(rawRefreshToken, token.tokenHash);
        if (matches) {
          await this.refreshTokenRepo.update(token.id, { isRevoked: true });
          break;
        }
      }
    } else {
      // Revoke ALL tokens (logout from all devices)
      await this.refreshTokenRepo.update({ userId, isRevoked: false }, { isRevoked: true });
    }
    this.logger.log(`User logged out: ${userId}`);
  }

  // ─── Token Generation ─────────────────────────────────────────────────────

  private async generateTokenPair(
    userId: string,
    email: string,
    role: Role,
    societyId: string | null,
    unitId?: string | null,
    gateId?: string | null,
    vendorId?: string | null,
    ipAddress?: string,
    deviceInfo?: string,
  ): Promise<TokenPair> {
    const jwtPayload: Omit<AuthUser, 'iat' | 'exp'> = {
      sub: userId,
      email,
      role,
      societyId,
      unitId: unitId ?? null,
      gateId: gateId ?? null,
      vendorId: vendorId ?? null,
    };

    const accessTokenExpiry = this.configService.get<string>('JWT_EXPIRES_IN', '15m');
    const refreshTokenExpiry = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');

    // Sign access token
    const accessToken = this.jwtService.sign(jwtPayload, {
      secret: this.configService.getOrThrow('JWT_SECRET'),
      expiresIn: accessTokenExpiry as unknown as number,
    });

    // Sign refresh token
    const rawRefreshToken = this.jwtService.sign(jwtPayload, {
      secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
      expiresIn: refreshTokenExpiry as unknown as number,
    });

    // Hash and store refresh token
    const tokenHash = await bcrypt.hash(rawRefreshToken, this.BCRYPT_ROUNDS);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.refreshTokenRepo.save(
      this.refreshTokenRepo.create({
        userId,
        tokenHash,
        ipAddress: ipAddress ?? null,
        deviceInfo: deviceInfo ?? null,
        isRevoked: false,
        expiresAt,
      }),
    );

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: accessTokenExpiry,
      tokenType: 'Bearer',
    };
  }
}
