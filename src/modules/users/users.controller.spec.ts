import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const dummyUser: AuthUser = {
    sub: 'u-admin',
    email: 'admin@soc.com',
    role: Role.SOCIETY_ADMIN,
    societyId: 'soc-1',
    iat: 0,
    exp: 0,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  describe('create', () => {
    it('should forward create request to usersService', async () => {
      const dto = { email: 'test@example.com' } as any;
      mockUsersService.create.mockResolvedValueOnce({ id: 'u-1', email: 'test@example.com' });

      const res = await controller.create(dto, dummyUser);

      expect(res.id).toBe('u-1');
      expect(mockUsersService.create).toHaveBeenCalledWith(dto, dummyUser);
    });
  });

  describe('findAll', () => {
    it('should list users scoped by requestingUser', async () => {
      mockUsersService.findAll.mockResolvedValueOnce([{ id: 'u-1' }]);

      const res = await controller.findAll(dummyUser);

      expect(res).toHaveLength(1);
      expect(mockUsersService.findAll).toHaveBeenCalledWith(dummyUser);
    });
  });

  describe('findOne', () => {
    it('should fetch single user', async () => {
      mockUsersService.findOne.mockResolvedValueOnce({ id: 'u-1' });

      const res = await controller.findOne('u-1', dummyUser);

      expect(res.id).toBe('u-1');
      expect(mockUsersService.findOne).toHaveBeenCalledWith('u-1', dummyUser);
    });
  });
});
