import { Test, TestingModule } from '@nestjs/testing';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';

describe('TenantsController', () => {
  let controller: TenantsController;

  const mockTenantsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantsController],
      providers: [
        { provide: TenantsService, useValue: mockTenantsService },
      ],
    }).compile();

    controller = module.get<TenantsController>(TenantsController);
  });

  describe('create', () => {
    it('should call tenantsService.create', async () => {
      const dto = { name: 'Test Tenant' } as any;
      mockTenantsService.create.mockResolvedValueOnce({ id: 'ten-1' });

      const res = await controller.create(dto);

      expect(res.id).toBe('ten-1');
      expect(mockTenantsService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all tenants', async () => {
      mockTenantsService.findAll.mockResolvedValueOnce([{ id: 'ten-1' }]);

      const res = await controller.findAll();

      expect(res).toHaveLength(1);
    });
  });
});
