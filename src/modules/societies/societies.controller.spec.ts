import { Test, TestingModule } from '@nestjs/testing';
import { SocietiesController } from './societies.controller';
import { SocietiesService } from './societies.service';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

describe('SocietiesController', () => {
  let controller: SocietiesController;

  const mockSocietiesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const dummyUser: AuthUser = {
    sub: 'admin-1',
    email: 'admin@soc.com',
    role: Role.SOCIETY_ADMIN,
    societyId: 'soc-1',
    iat: 0,
    exp: 0,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SocietiesController],
      providers: [
        { provide: SocietiesService, useValue: mockSocietiesService },
      ],
    }).compile();

    controller = module.get<SocietiesController>(SocietiesController);
  });

  describe('create', () => {
    it('should forward create call to societiesService', async () => {
      const dto = { name: 'Green Valley' } as any;
      mockSocietiesService.create.mockResolvedValueOnce({ id: 'soc-1' });

      const res = await controller.create(dto, dummyUser);

      expect(res.id).toBe('soc-1');
      expect(mockSocietiesService.create).toHaveBeenCalledWith(dto, dummyUser);
    });
  });

  describe('findOne', () => {
    it('should return society details', async () => {
      mockSocietiesService.findOne.mockResolvedValueOnce({ id: 'soc-1' });

      const res = await controller.findOne('soc-1', dummyUser);

      expect(res.id).toBe('soc-1');
      expect(mockSocietiesService.findOne).toHaveBeenCalledWith('soc-1', dummyUser);
    });
  });
});
