import { Test, TestingModule } from '@nestjs/testing';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import {
  AssetCategory,
  AssetStatus,
  MaintenanceType,
  MaintenanceLogStatus,
  MaintenanceFrequency,
  DepreciationMethod,
} from '../../common/enums/asset.enum';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

describe('AssetsController', () => {
  let controller: AssetsController;

  const mockAssetsService = {
    createAsset: jest.fn(),
    findAllAssets: jest.fn(),
    findAssetById: jest.fn(),
    updateAsset: jest.fn(),
    disposeAsset: jest.fn(),
    getDueMaintenanceAssets: jest.fn(),
    addMaintenanceLog: jest.fn(),
    getMaintenanceLogs: jest.fn(),
    updateMaintenanceLog: jest.fn(),
    createSchedule: jest.fn(),
    updateSchedule: jest.fn(),
    recordDepreciation: jest.fn(),
    getDepreciationLogs: jest.fn(),
  };

  const adminUser: AuthUser = {
    sub: 'admin-1',
    email: 'admin@society.com',
    role: Role.SOCIETY_ADMIN,
    societyId: 'soc-100',
    iat: 0,
    exp: 0,
  };

  const mockAsset = {
    id: 'asset-1',
    societyId: 'soc-100',
    category: AssetCategory.LIFT,
    name: 'Main Lobby Lift',
    location: 'Block A',
    status: AssetStatus.ACTIVE,
    purchaseCost: 500000,
    currentValue: 450000,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetsController],
      providers: [
        { provide: AssetsService, useValue: mockAssetsService },
      ],
    }).compile();

    controller = module.get<AssetsController>(AssetsController);
  });

  describe('createAsset', () => {
    it('should call service and return created asset', async () => {
      mockAssetsService.createAsset.mockResolvedValue(mockAsset);

      const dto = {
        category: AssetCategory.LIFT,
        name: 'Main Lobby Lift',
        location: 'Block A',
      };
      const result = await controller.createAsset(adminUser, dto);

      expect(result).toEqual(mockAsset);
      expect(mockAssetsService.createAsset).toHaveBeenCalledWith(adminUser, dto);
    });
  });

  describe('findAllAssets', () => {
    it('should return list of assets', async () => {
      mockAssetsService.findAllAssets.mockResolvedValue([mockAsset]);

      const result = await controller.findAllAssets(adminUser, {});
      expect(result).toHaveLength(1);
      expect(mockAssetsService.findAllAssets).toHaveBeenCalledWith(adminUser, {});
    });

    it('should pass filter params to service', async () => {
      mockAssetsService.findAllAssets.mockResolvedValue([]);
      const filter = { category: AssetCategory.GENERATOR, status: AssetStatus.ACTIVE };

      await controller.findAllAssets(adminUser, filter);
      expect(mockAssetsService.findAllAssets).toHaveBeenCalledWith(adminUser, filter);
    });
  });

  describe('getDueMaintenanceAssets', () => {
    it('should return due maintenance summary', async () => {
      const summary = { overdueSchedules: [], expiringWarranty: [mockAsset], expiringAmc: [] };
      mockAssetsService.getDueMaintenanceAssets.mockResolvedValue(summary);

      const result = await controller.getDueMaintenanceAssets(adminUser);
      expect(result.expiringWarranty).toHaveLength(1);
    });
  });

  describe('findAssetById', () => {
    it('should return a single asset', async () => {
      mockAssetsService.findAssetById.mockResolvedValue(mockAsset);

      const result = await controller.findAssetById(adminUser, 'asset-1');
      expect(result).toEqual(mockAsset);
      expect(mockAssetsService.findAssetById).toHaveBeenCalledWith(adminUser, 'asset-1');
    });
  });

  describe('updateAsset', () => {
    it('should update and return asset', async () => {
      const updated = { ...mockAsset, name: 'Updated Lift' };
      mockAssetsService.updateAsset.mockResolvedValue(updated);

      const result = await controller.updateAsset(adminUser, 'asset-1', { name: 'Updated Lift' });
      expect(result.name).toBe('Updated Lift');
    });
  });

  describe('disposeAsset', () => {
    it('should dispose asset', async () => {
      const disposed = { ...mockAsset, status: AssetStatus.DISPOSED, disposalDate: new Date() };
      mockAssetsService.disposeAsset.mockResolvedValue(disposed);

      const result = await controller.disposeAsset(adminUser, 'asset-1', {
        disposalDate: '2026-09-11',
        disposalValue: 50000,
      });

      expect(result.status).toBe(AssetStatus.DISPOSED);
    });
  });

  describe('addMaintenanceLog', () => {
    it('should create maintenance log', async () => {
      const log = {
        id: 'log-1',
        assetId: 'asset-1',
        maintenanceType: MaintenanceType.PREVENTIVE,
        status: MaintenanceLogStatus.SCHEDULED,
      };
      mockAssetsService.addMaintenanceLog.mockResolvedValue(log);

      const dto = {
        maintenanceType: MaintenanceType.PREVENTIVE,
        scheduledDate: '2026-09-15',
      };
      const result = await controller.addMaintenanceLog(adminUser, 'asset-1', dto);

      expect(result.maintenanceType).toBe(MaintenanceType.PREVENTIVE);
    });
  });

  describe('getMaintenanceLogs', () => {
    it('should return maintenance logs for an asset', async () => {
      mockAssetsService.getMaintenanceLogs.mockResolvedValue([{ id: 'log-1' }]);

      const result = await controller.getMaintenanceLogs(adminUser, 'asset-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('updateMaintenanceLog', () => {
    it('should update maintenance log', async () => {
      const updated = { id: 'log-1', status: MaintenanceLogStatus.COMPLETED };
      mockAssetsService.updateMaintenanceLog.mockResolvedValue(updated);

      const result = await controller.updateMaintenanceLog(
        adminUser,
        'asset-1',
        'log-1',
        { status: MaintenanceLogStatus.COMPLETED },
      );
      expect(result.status).toBe(MaintenanceLogStatus.COMPLETED);
    });
  });

  describe('createSchedule', () => {
    it('should create a maintenance schedule', async () => {
      const schedule = { id: 'sched-1', frequency: MaintenanceFrequency.MONTHLY };
      mockAssetsService.createSchedule.mockResolvedValue(schedule);

      const result = await controller.createSchedule(adminUser, 'asset-1', {
        frequency: MaintenanceFrequency.MONTHLY,
        nextDueDate: '2026-10-01',
      });
      expect(result.frequency).toBe(MaintenanceFrequency.MONTHLY);
    });
  });

  describe('updateSchedule', () => {
    it('should update maintenance schedule', async () => {
      const updated = { id: 'sched-1', isActive: false };
      mockAssetsService.updateSchedule.mockResolvedValue(updated);

      const result = await controller.updateSchedule(adminUser, 'asset-1', 'sched-1', {
        isActive: false,
      });
      expect(result.isActive).toBe(false);
    });
  });

  describe('recordDepreciation', () => {
    it('should record depreciation entry', async () => {
      const entry = { id: 'dep-1', depreciationAmount: 25000, bookValueAfter: 425000 };
      mockAssetsService.recordDepreciation.mockResolvedValue(entry);

      const result = await controller.recordDepreciation(adminUser, 'asset-1', {
        depreciationDate: '2026-09-30',
        depreciationAmount: 25000,
        method: DepreciationMethod.STRAIGHT_LINE,
      });
      expect(result.bookValueAfter).toBe(425000);
    });
  });

  describe('getDepreciationLogs', () => {
    it('should return depreciation logs', async () => {
      mockAssetsService.getDepreciationLogs.mockResolvedValue([{ id: 'dep-1' }]);

      const result = await controller.getDepreciationLogs(adminUser, 'asset-1');
      expect(result).toHaveLength(1);
    });
  });
});
