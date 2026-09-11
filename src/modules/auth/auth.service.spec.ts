import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { Role } from '../../common/enums/role.enum';
import { User } from '../users/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    create: jest.fn(),
    findByEmail: jest.fn(),
    incrementFailedLogin: jest.fn(),
    resetFailedLogin: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, def?: any) => {
      if (key === 'JWT_SECRET') return 'test-access-secret-32-chars-length!!';
      if (key === 'JWT_REFRESH_SECRET') return 'test-refresh-secret-32-chars-length!!';
      if (key === 'JWT_EXPIRES_IN') return '15m';
      if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
      return def;
    }),
    getOrThrow: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') return 'test-access-secret-32-chars-length!!';
      if (key === 'JWT_REFRESH_SECRET') return 'test-refresh-secret-32-chars-length!!';
      return 'secret';
    }),
  };

  const mockRefreshTokenRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: getRepositoryToken(RefreshToken), useValue: mockRefreshTokenRepo },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a new resident user successfully (happy path)', async () => {
      const dto = {
        email: 'resident@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        phone: '9876543210',
      };

      const mockCreatedUser = {
        id: 'u-1',
        email: 'resident@example.com',
        role: Role.RESIDENT,
        societyId: null,
      } as User;

      mockUsersService.create.mockResolvedValueOnce(mockCreatedUser);
      mockJwtService.sign
        .mockReturnValueOnce('access-token-123')
        .mockReturnValueOnce('refresh-token-456');
      mockRefreshTokenRepo.create.mockReturnValue({});
      mockRefreshTokenRepo.save.mockResolvedValue({});

      const result = await service.register(dto);

      expect(result.accessToken).toBe('access-token-123');
      expect(result.refreshToken).toBe('refresh-token-456');
      expect(result.tokenType).toBe('Bearer');
      expect(mockUsersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: dto.email, role: Role.RESIDENT }),
        expect.any(Object),
      );
    });

    it('should reject self-registration with elevated roles (authorization failure)', async () => {
      const dto = {
        email: 'hacker@example.com',
        password: 'Password123!',
        firstName: 'Bad',
        lastName: 'Actor',
        role: Role.SUPER_ADMIN,
      };

      await expect(service.register(dto as any)).rejects.toThrow(ForbiddenException);
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should successfully log in and issue tokens (happy path)', async () => {
      const passwordHash = await bcrypt.hash('Secret123!', 10);
      const mockUser = {
        id: 'u-1',
        email: 'user@example.com',
        passwordHash,
        role: Role.RESIDENT,
        societyId: 'soc-1',
        isActive: true,
        lockedUntil: null,
        validatePassword: jest.fn().mockResolvedValue(true),
      } as unknown as User;

      mockUsersService.findByEmail.mockResolvedValueOnce(mockUser);
      mockJwtService.sign
        .mockReturnValueOnce('access-token-xyz')
        .mockReturnValueOnce('refresh-token-xyz');
      mockRefreshTokenRepo.create.mockReturnValue({});
      mockRefreshTokenRepo.save.mockResolvedValue({});

      const result = await service.login({ email: 'user@example.com', password: 'Secret123!' });

      expect(result.accessToken).toBe('access-token-xyz');
      expect(mockUsersService.resetFailedLogin).toHaveBeenCalledWith('u-1');
      expect(mockRefreshTokenRepo.save).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password does not match', async () => {
      const passwordHash = await bcrypt.hash('Secret123!', 10);
      const mockUser = {
        id: 'u-1',
        email: 'user@example.com',
        passwordHash,
        role: Role.RESIDENT,
        societyId: 'soc-1',
        isActive: true,
        lockedUntil: null,
        validatePassword: jest.fn().mockResolvedValue(false),
      } as unknown as User;

      mockUsersService.findByEmail.mockResolvedValueOnce(mockUser);

      await expect(
        service.login({ email: 'user@example.com', password: 'WrongPassword' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockUsersService.incrementFailedLogin).toHaveBeenCalledWith('u-1');
    });

    it('should throw UnauthorizedException when account is locked', async () => {
      const mockUser = {
        id: 'u-1',
        email: 'user@example.com',
        passwordHash: 'hash',
        isLocked: true,
        lockedUntil: new Date(Date.now() + 600000), // locked in future
        validatePassword: jest.fn(),
      } as unknown as User;

      mockUsersService.findByEmail.mockResolvedValueOnce(mockUser);

      await expect(
        service.login({ email: 'user@example.com', password: 'Secret123!' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout & token revocation', () => {
    it('should revoke matching refresh token on logout', async () => {
      const tokenHash = await bcrypt.hash('raw-refresh-token', 10);
      mockRefreshTokenRepo.find.mockResolvedValueOnce([
        { id: 'rt-1', tokenHash, isRevoked: false },
      ]);

      await service.logout('u-1', 'raw-refresh-token');

      expect(mockRefreshTokenRepo.update).toHaveBeenCalledWith('rt-1', { isRevoked: true });
    });

    it('should revoke all tokens on logout without token parameter', async () => {
      await service.logout('u-1');

      expect(mockRefreshTokenRepo.update).toHaveBeenCalledWith(
        { userId: 'u-1', isRevoked: false },
        { isRevoked: true },
      );
    });
  });
});
