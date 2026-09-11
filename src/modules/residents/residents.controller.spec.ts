import { Test, TestingModule } from '@nestjs/testing';
import { ResidentsController } from './residents.controller';
import { ResidentsService } from './residents.service';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

describe('ResidentsController', () => {
  let controller: ResidentsController;

  const mockResidentsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    addFamilyMember: jest.fn(),
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
      controllers: [ResidentsController],
      providers: [
        { provide: ResidentsService, useValue: mockResidentsService },
      ],
    }).compile();

    controller = module.get<ResidentsController>(ResidentsController);
  });

  describe('create', () => {
    it('should forward create to residentsService with user societyId', async () => {
      const dto = { unitId: 'u-1' } as any;
      mockResidentsService.create.mockResolvedValueOnce({ id: 'res-1' });

      const res = await controller.create(dto, dummyUser);

      expect(res.id).toBe('res-1');
      expect(mockResidentsService.create).toHaveBeenCalledWith('soc-1', dto);
    });
  });

  describe('findAll', () => {
    it('should return residents in society', async () => {
      mockResidentsService.findAll.mockResolvedValueOnce([{ id: 'res-1' }]);

      const res = await controller.findAll(dummyUser);

      expect(res).toHaveLength(1);
      expect(mockResidentsService.findAll).toHaveBeenCalledWith('soc-1');
    });
  });
});
