import { Test, TestingModule } from '@nestjs/testing';
import { ComplaintsController } from './complaints.controller';
import { ComplaintsService } from './complaints.service';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

describe('ComplaintsController', () => {
  let controller: ComplaintsController;

  const mockComplaintsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    updateStatus: jest.fn(),
    addComment: jest.fn(),
    getAnalytics: jest.fn(),
  };

  const dummyUser: AuthUser = {
    sub: 'res-1',
    email: 'res@soc.com',
    role: Role.RESIDENT,
    societyId: 'soc-1',
    unitId: 'u-101',
    iat: 0,
    exp: 0,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComplaintsController],
      providers: [
        { provide: ComplaintsService, useValue: mockComplaintsService },
      ],
    }).compile();

    controller = module.get<ComplaintsController>(ComplaintsController);
  });

  describe('create', () => {
    it('should forward create complaint with authUser', async () => {
      const dto = { title: 'Leakage' } as any;
      mockComplaintsService.create.mockResolvedValueOnce({ id: 'c-1' });

      const res = await controller.create(dto, dummyUser);

      expect(res.id).toBe('c-1');
      expect(mockComplaintsService.create).toHaveBeenCalledWith(dummyUser, dto);
    });
  });

  describe('findAll', () => {
    it('should list complaints scoped by user role', async () => {
      mockComplaintsService.findAll.mockResolvedValueOnce([{ id: 'c-1' }]);

      const res = await controller.findAll({}, dummyUser);

      expect(res).toHaveLength(1);
      expect(mockComplaintsService.findAll).toHaveBeenCalledWith(dummyUser, {});
    });
  });
});
