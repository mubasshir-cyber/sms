import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    logoutAll: jest.fn(),
  };

  const dummyUser: AuthUser = {
    sub: 'u-1',
    email: 'user@example.com',
    role: Role.RESIDENT,
    societyId: 'soc-1',
    iat: 0,
    exp: 0,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('register', () => {
    it('should invoke authService.register and return tokens', async () => {
      const dto = { email: 'test@example.com', password: 'Pass' } as any;
      mockAuthService.register.mockResolvedValueOnce({ accessToken: 'a', refreshToken: 'r' });

      const res = await controller.register(dto);

      expect(res.accessToken).toBe('a');
      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('should invoke authService.login with ip and user agent', async () => {
      const dto = { email: 'test@example.com', password: 'Pass' } as any;
      mockAuthService.login.mockResolvedValueOnce({ accessToken: 'a' });

      const mockReq = {
        headers: {
          'x-forwarded-for': '127.0.0.1',
          'user-agent': 'JestTestAgent',
        },
        socket: { remoteAddress: '127.0.0.1' },
      } as any;

      const res = await controller.login(dto, mockReq);

      expect(res.accessToken).toBe('a');
      expect(mockAuthService.login).toHaveBeenCalledWith(dto, '127.0.0.1', 'JestTestAgent');
    });
  });

  describe('logout', () => {
    it('should call authService.logout with current user sub', async () => {
      await controller.logout(dummyUser, { refreshToken: 'ref-token' });

      expect(mockAuthService.logout).toHaveBeenCalledWith('u-1', 'ref-token');
    });
  });

  describe('me', () => {
    it('should return current authenticated user payload', () => {
      const me = controller.me(dummyUser);

      expect(me).toEqual(dummyUser);
    });
  });
});
