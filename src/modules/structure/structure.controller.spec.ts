import { Test, TestingModule } from '@nestjs/testing';
import { StructureController } from './structure.controller';
import { StructureService } from './structure.service';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

describe('StructureController', () => {
  let controller: StructureController;

  const mockStructureService = {
    createTower: jest.fn(),
    findAllTowers: jest.fn(),
    findOneTower: jest.fn(),
    createFloor: jest.fn(),
    createUnit: jest.fn(),
    findOneUnit: jest.fn(),
    bulkImportUnits: jest.fn(),
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
      controllers: [StructureController],
      providers: [
        { provide: StructureService, useValue: mockStructureService },
      ],
    }).compile();

    controller = module.get<StructureController>(StructureController);
  });

  describe('createTower', () => {
    it('should forward createTower call with user societyId', async () => {
      const dto = { name: 'Tower B' } as any;
      mockStructureService.createTower.mockResolvedValueOnce({ id: 'tow-2' });

      const res = await controller.createTower('soc-1', dto, dummyUser);

      expect(res.id).toBe('tow-2');
      expect(mockStructureService.createTower).toHaveBeenCalledWith('soc-1', dto);
    });
  });

  describe('createUnit', () => {
    it('should forward createUnit call', async () => {
      const dto = { unitNumber: '201' } as any;
      mockStructureService.createUnit.mockResolvedValueOnce({ id: 'u-201' });

      const res = await controller.createUnit('soc-1', dto, dummyUser);

      expect(res.id).toBe('u-201');
      expect(mockStructureService.createUnit).toHaveBeenCalledWith('soc-1', dto);
    });
  });
});
