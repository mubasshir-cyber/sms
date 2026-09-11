import { Test, TestingModule } from '@nestjs/testing';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

import { getQueueToken } from '@nestjs/bullmq';
import { BILLING_QUEUE } from './billing.scheduler';

describe('MaintenanceController', () => {
  let controller: MaintenanceController;

  const mockMaintenanceService = {
    createHead: jest.fn(),
    findAllHeads: jest.fn(),
    createRule: jest.fn(),
    findAllRules: jest.fn(),
    generateInvoices: jest.fn(),
    findAllInvoices: jest.fn(),
    findOneInvoice: jest.fn(),
  };

  const mockBillingQueue = {
    add: jest.fn(),
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
      controllers: [MaintenanceController],
      providers: [
        { provide: MaintenanceService, useValue: mockMaintenanceService },
        { provide: getQueueToken(BILLING_QUEUE), useValue: mockBillingQueue },
      ],
    }).compile();

    controller = module.get<MaintenanceController>(MaintenanceController);
  });

  describe('generateInvoices', () => {
    it('should forward generateInvoices call', async () => {
      const dto = { month: 9, year: 2026 } as any;
      mockMaintenanceService.generateInvoices.mockResolvedValueOnce({ generated: 5 });

      const res = await controller.generateInvoices(dto, dummyUser);

      expect(res.generated).toBe(5);
      expect(mockMaintenanceService.generateInvoices).toHaveBeenCalledWith('soc-1', dto);
    });
  });

  describe('findAllHeads', () => {
    it('should return heads for society', async () => {
      mockMaintenanceService.findAllHeads.mockResolvedValueOnce([{ id: 'h-1' }]);

      const res = await controller.findAllHeads(dummyUser);

      expect(res).toHaveLength(1);
      expect(mockMaintenanceService.findAllHeads).toHaveBeenCalledWith('soc-1');
    });
  });
});
