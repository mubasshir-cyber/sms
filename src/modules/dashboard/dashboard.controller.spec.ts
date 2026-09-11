import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: DashboardService;

  const mockDashboardService = {
    getSummary: jest.fn(),
    getOperationsSummary: jest.fn(),
    getAlerts: jest.fn(),
    getRecentActivity: jest.fn(),
  };

  const dummyUser: AuthUser = {
    userId: 'u-1',
    email: 'admin@society.com',
    role: Role.SOCIETY_ADMIN,
    societyId: 'soc-1234',
    tenantId: 'ten-1234',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        { provide: DashboardService, useValue: mockDashboardService },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
    service = module.get<DashboardService>(DashboardService);
  });

  describe('getSummary', () => {
    it('should return summary for user society', async () => {
      const summaryResult = { totalUnits: 50 } as any;
      mockDashboardService.getSummary.mockResolvedValueOnce(summaryResult);

      const res = await controller.getSummary(dummyUser);

      expect(res).toBe(summaryResult);
      expect(mockDashboardService.getSummary).toHaveBeenCalledWith('soc-1234');
    });

    it('should throw BadRequestException if societyId is null', async () => {
      const userWithoutSociety = { ...dummyUser, societyId: null };

      expect(() => controller.getSummary(userWithoutSociety)).toThrow(BadRequestException);
    });
  });

  describe('getOperations', () => {
    it('should return operations summary', async () => {
      const opsResult = { complaints: { open: 2 } } as any;
      mockDashboardService.getOperationsSummary.mockResolvedValueOnce(opsResult);

      const res = await controller.getOperations(dummyUser);

      expect(res).toBe(opsResult);
      expect(mockDashboardService.getOperationsSummary).toHaveBeenCalledWith('soc-1234');
    });
  });

  describe('getAlerts', () => {
    it('should return alerts', async () => {
      const alertsResult = { overdueInvoices: 3 } as any;
      mockDashboardService.getAlerts.mockResolvedValueOnce(alertsResult);

      const res = await controller.getAlerts(dummyUser);

      expect(res).toBe(alertsResult);
      expect(mockDashboardService.getAlerts).toHaveBeenCalledWith('soc-1234');
    });
  });

  describe('getRecentActivity', () => {
    it('should return recent activity with parsed limit', async () => {
      const activityResult = [{ type: 'PAYMENT' }] as any;
      mockDashboardService.getRecentActivity.mockResolvedValueOnce(activityResult);

      const res = await controller.getRecentActivity(dummyUser, '20');

      expect(res).toBe(activityResult);
      expect(mockDashboardService.getRecentActivity).toHaveBeenCalledWith('soc-1234', 20);
    });

    it('should use default limit 15 if not provided', async () => {
      const activityResult = [] as any;
      mockDashboardService.getRecentActivity.mockResolvedValueOnce(activityResult);

      await controller.getRecentActivity(dummyUser);

      expect(mockDashboardService.getRecentActivity).toHaveBeenCalledWith('soc-1234', 15);
    });
  });
});
