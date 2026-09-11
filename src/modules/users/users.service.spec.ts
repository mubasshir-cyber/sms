import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

describe('UsersService', () => {
  let service: UsersService;

  const mockUsersRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    softRemove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const adminUser: AuthUser = {
    sub: 'admin-1',
    email: 'admin@society.com',
    role: Role.SOCIETY_ADMIN,
    societyId: 'soc-123',
    iat: 0,
    exp: 0,
  };

  const superAdminUser: AuthUser = {
    sub: 'super-1',
    email: 'super@sms.com',
    role: Role.SUPER_ADMIN,
    societyId: null,
    iat: 0,
    exp: 0,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUsersRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    it('should create user scoped to societyId of requesting admin (happy path)', async () => {
      mockUsersRepo.findOne.mockResolvedValueOnce(null); // email not taken
      mockUsersRepo.create.mockReturnValue({ id: 'u-new', email: 'test@example.com' });
      mockUsersRepo.save.mockResolvedValue({ id: 'u-new', email: 'test@example.com' });

      const dto = {
        email: 'test@example.com',
        firstName: 'Bob',
        lastName: 'Smith',
        role: Role.RESIDENT,
      };

      const result = await service.create(dto as any, adminUser);

      expect(result.id).toBe('u-new');
      expect(mockUsersRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          societyId: 'soc-123',
        }),
      );
    });

    it('should throw ConflictException on duplicate email', async () => {
      mockUsersRepo.findOne.mockResolvedValueOnce({ id: 'existing' });

      const dto = { email: 'dup@example.com' };

      await expect(service.create(dto as any, adminUser)).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException if non-super-admin tries to create SUPER_ADMIN', async () => {
      mockUsersRepo.findOne.mockResolvedValueOnce(null);

      const dto = { email: 'hacker@sms.com', role: Role.SUPER_ADMIN };

      await expect(service.create(dto as any, adminUser)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOne & tenant isolation', () => {
    it('should scope findOne by societyId for regular admin (tenant isolation)', async () => {
      mockUsersRepo.findOne.mockResolvedValueOnce({ id: 'u-1', societyId: 'soc-123' });

      const user = await service.findOne('u-1', adminUser);

      expect(user.id).toBe('u-1');
      expect(mockUsersRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'u-1', societyId: 'soc-123' },
      });
    });

    it('should allow SUPER_ADMIN to find user across any society', async () => {
      mockUsersRepo.findOne.mockResolvedValueOnce({ id: 'u-1', societyId: 'soc-999' });

      const user = await service.findOne('u-1', superAdminUser);

      expect(user.id).toBe('u-1');
      expect(mockUsersRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'u-1' },
      });
    });

    it('should throw NotFoundException if user does not exist in society scope', async () => {
      mockUsersRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.findOne('u-missing', adminUser)).rejects.toThrow(NotFoundException);
    });
  });
});
