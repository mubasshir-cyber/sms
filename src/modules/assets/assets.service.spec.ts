import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { AssetsService } from './assets.service';
import { Asset } from './entities/asset.entity';
import { AssetMaintenanceLog } from './entities/asset-maintenance-log.entity';
import { AssetMaintenanceSchedule } from './entities/asset-maintenance-schedule.entity';
import { AssetDepreciationLog } from './entities/asset-depreciation-log.entity';
import { NotificationsService } from '../notifications/notifications.service';
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

describe('AssetsService', () => {
  let service: AssetsService;

  const mockAssetsRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockLogsRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockSchedulesRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockDepreciationRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockNotificationsService = {
    send: jest.fn(),
  };

  const adminUser: AuthUser = {
    sub: 'admin-1',
    email: 'admin@society.com',
    role: Role.SOCIETY_ADMIN,
    societyId: 'soc-100',
    iat: 0,
    exp: 0,
  };

  const mockAsset: Asset = {
    id: 'asset-1',
    societyId: 'soc-100',
    category: AssetCategory.LIFT,
    name: 'Main Lobby Lift',
    model: 'Otis Gen2',
    manufacturer: 'Otis',
    serialNumber: 'OT-001',
    location: 'Block A Basement',
    purchaseDate: new Date('2024-01-01'),
    purchaseCost: 500000,
    currentValue: 450000,
    warrantyExpiryDate: new Date('2027-01-01'),
    amcVendorId: null,
    amcContractId: null,
    amcExpiryDate: null,
    lastWarrantyAlertSentAt: null,
    lastAmcAlertSentAt: null,
    status: AssetStatus.ACTIVE,
    disposalDate: null,
    disposalValue: null,
    photoUrls: null,
    notes: null,
    maintenanceLogs: [],
    maintenanceSchedules: [],
    depreciationLogs: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as unknown as Asset;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetsService,
        { provide: getRepositoryToken(Asset), useValue: mockAssetsRepo },
        { provide: getRepositoryToken(AssetMaintenanceLog), useValue: mockLogsRepo },
        { provide: getRepositoryToken(AssetMaintenanceSchedule), useValue: mockSchedulesRepo },
        { provide: getRepositoryToken(AssetDepreciationLog), useValue: mockDepreciationRepo },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<AssetsService>(AssetsService);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // getSocietyId guard
  // ═══════════════════════════════════════════════════════════════════════════
  describe('getSocietyId', () => {
    it('should throw ForbiddenException when user has no societyId and is not SUPER_ADMIN', async () => {
      const noSocietyUser: AuthUser = { ...adminUser, societyId: undefined, role: Role.RESIDENT };
      mockAssetsRepo.create.mockReturnValue({});
      mockAssetsRepo.save.mockResolvedValue(mockAsset);

      await expect(
        service.createAsset(noSocietyUser, {
          category: AssetCategory.LIFT,
          name: 'Test',
          location: 'Block A',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // createAsset
  // ═══════════════════════════════════════════════════════════════════════════
  describe('createAsset', () => {
    it('should create an asset successfully', async () => {
      mockAssetsRepo.create.mockReturnValue(mockAsset);
      mockAssetsRepo.save.mockResolvedValue(mockAsset);

      const result = await service.createAsset(adminUser, {
        category: AssetCategory.LIFT,
        name: 'Main Lobby Lift',
        location: 'Block A Basement',
        purchaseCost: 500000,
      });

      expect(result).toEqual(mockAsset);
      expect(mockAssetsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          societyId: 'soc-100',
          category: AssetCategory.LIFT,
          name: 'Main Lobby Lift',
          currentValue: 500000,
        }),
      );
    });

    it('should set currentValue equal to purchaseCost on creation', async () => {
      const assetWithCost = { ...mockAsset, purchaseCost: 100000, currentValue: 100000 };
      mockAssetsRepo.create.mockReturnValue(assetWithCost);
      mockAssetsRepo.save.mockResolvedValue(assetWithCost);

      await service.createAsset(adminUser, {
        category: AssetCategory.GENERATOR,
        name: 'DG Set',
        location: 'Basement',
        purchaseCost: 100000,
      });

      expect(mockAssetsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ purchaseCost: 100000, currentValue: 100000 }),
      );
    });

    it('should allow null purchaseCost and currentValue', async () => {
      const assetNoCost = { ...mockAsset, purchaseCost: null, currentValue: null };
      mockAssetsRepo.create.mockReturnValue(assetNoCost);
      mockAssetsRepo.save.mockResolvedValue(assetNoCost);

      await service.createAsset(adminUser, {
        category: AssetCategory.FURNITURE,
        name: 'Lobby Sofa',
        location: 'Lobby',
      });

      expect(mockAssetsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ purchaseCost: null, currentValue: null }),
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // findAllAssets
  // ═══════════════════════════════════════════════════════════════════════════
  describe('findAllAssets', () => {
    it('should return all assets for a society', async () => {
      mockAssetsRepo.find.mockResolvedValue([mockAsset]);

      const result = await service.findAllAssets(adminUser, {});
      expect(result).toHaveLength(1);
      expect(mockAssetsRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { societyId: 'soc-100' } }),
      );
    });

    it('should apply category filter', async () => {
      mockAssetsRepo.find.mockResolvedValue([mockAsset]);

      await service.findAllAssets(adminUser, { category: AssetCategory.LIFT });
      expect(mockAssetsRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { societyId: 'soc-100', category: AssetCategory.LIFT },
        }),
      );
    });

    it('should apply status filter', async () => {
      mockAssetsRepo.find.mockResolvedValue([]);

      await service.findAllAssets(adminUser, { status: AssetStatus.DISPOSED });
      expect(mockAssetsRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { societyId: 'soc-100', status: AssetStatus.DISPOSED },
        }),
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // findAssetById
  // ═══════════════════════════════════════════════════════════════════════════
  describe('findAssetById', () => {
    it('should return the asset when found', async () => {
      mockAssetsRepo.findOne.mockResolvedValue(mockAsset);
      const result = await service.findAssetById(adminUser, 'asset-1');
      expect(result).toEqual(mockAsset);
    });

    it('should throw NotFoundException when asset not found', async () => {
      mockAssetsRepo.findOne.mockResolvedValue(null);
      await expect(service.findAssetById(adminUser, 'bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // updateAsset
  // ═══════════════════════════════════════════════════════════════════════════
  describe('updateAsset', () => {
    it('should update asset fields', async () => {
      mockAssetsRepo.findOne.mockResolvedValue({ ...mockAsset });
      mockAssetsRepo.save.mockResolvedValue({ ...mockAsset, name: 'Updated Name' });

      const result = await service.updateAsset(adminUser, 'asset-1', { name: 'Updated Name' });
      expect(result.name).toBe('Updated Name');
    });

    it('should throw BadRequestException for disposed asset', async () => {
      mockAssetsRepo.findOne.mockResolvedValue({
        ...mockAsset,
        status: AssetStatus.DISPOSED,
        maintenanceLogs: [],
        maintenanceSchedules: [],
        depreciationLogs: [],
      });

      await expect(
        service.updateAsset(adminUser, 'asset-1', { name: 'Changed' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // disposeAsset
  // ═══════════════════════════════════════════════════════════════════════════
  describe('disposeAsset', () => {
    it('should dispose asset and deactivate schedules', async () => {
      const activeAsset = { ...mockAsset, status: AssetStatus.ACTIVE, maintenanceLogs: [], maintenanceSchedules: [], depreciationLogs: [] };
      mockAssetsRepo.findOne.mockResolvedValue(activeAsset);
      mockAssetsRepo.save.mockResolvedValue({ ...activeAsset, status: AssetStatus.DISPOSED });
      mockSchedulesRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.disposeAsset(adminUser, 'asset-1', {
        disposalDate: '2026-09-11',
        disposalValue: 50000,
      });

      expect(result.status).toBe(AssetStatus.DISPOSED);
      expect(mockSchedulesRepo.update).toHaveBeenCalledWith(
        { assetId: 'asset-1', isActive: true },
        { isActive: false },
      );
    });

    it('should throw BadRequestException if already disposed', async () => {
      mockAssetsRepo.findOne.mockResolvedValue({
        ...mockAsset,
        status: AssetStatus.DISPOSED,
        maintenanceLogs: [],
        maintenanceSchedules: [],
        depreciationLogs: [],
      });

      await expect(
        service.disposeAsset(adminUser, 'asset-1', { disposalDate: '2026-09-11' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Maintenance Logs
  // ═══════════════════════════════════════════════════════════════════════════
  describe('addMaintenanceLog', () => {
    it('should create a maintenance log', async () => {
      mockAssetsRepo.findOne.mockResolvedValue({ ...mockAsset, maintenanceLogs: [], maintenanceSchedules: [], depreciationLogs: [] });
      const mockLog: Partial<AssetMaintenanceLog> = {
        id: 'log-1',
        assetId: 'asset-1',
        societyId: 'soc-100',
        maintenanceType: MaintenanceType.PREVENTIVE,
        status: MaintenanceLogStatus.SCHEDULED,
        scheduledDate: new Date('2026-09-15'),
      };
      mockLogsRepo.create.mockReturnValue(mockLog);
      mockLogsRepo.save.mockResolvedValue(mockLog);

      const result = await service.addMaintenanceLog(adminUser, 'asset-1', {
        maintenanceType: MaintenanceType.PREVENTIVE,
        scheduledDate: '2026-09-15',
      });

      expect(result.maintenanceType).toBe(MaintenanceType.PREVENTIVE);
    });

    it('should transition asset to UNDER_MAINTENANCE when log is IN_PROGRESS', async () => {
      const assetCopy = { ...mockAsset, status: AssetStatus.ACTIVE, maintenanceLogs: [], maintenanceSchedules: [], depreciationLogs: [] };
      mockAssetsRepo.findOne.mockResolvedValue(assetCopy);
      const mockLog = { id: 'log-2', status: MaintenanceLogStatus.IN_PROGRESS, scheduledDate: new Date() };
      mockLogsRepo.create.mockReturnValue(mockLog);
      mockLogsRepo.save.mockResolvedValue(mockLog);
      mockAssetsRepo.save.mockResolvedValue({ ...assetCopy, status: AssetStatus.UNDER_MAINTENANCE });

      await service.addMaintenanceLog(adminUser, 'asset-1', {
        maintenanceType: MaintenanceType.CORRECTIVE,
        scheduledDate: '2026-09-11',
        status: MaintenanceLogStatus.IN_PROGRESS,
      });

      expect(mockAssetsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: AssetStatus.UNDER_MAINTENANCE }),
      );
    });
  });

  describe('updateMaintenanceLog', () => {
    it('should throw NotFoundException for unknown log', async () => {
      mockAssetsRepo.findOne.mockResolvedValue({ ...mockAsset, maintenanceLogs: [], maintenanceSchedules: [], depreciationLogs: [] });
      mockLogsRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateMaintenanceLog(adminUser, 'asset-1', 'bad-log', { status: MaintenanceLogStatus.COMPLETED }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when log is already completed', async () => {
      mockAssetsRepo.findOne.mockResolvedValue({ ...mockAsset, maintenanceLogs: [], maintenanceSchedules: [], depreciationLogs: [] });
      mockLogsRepo.findOne.mockResolvedValue({ id: 'log-1', status: MaintenanceLogStatus.COMPLETED });

      await expect(
        service.updateMaintenanceLog(adminUser, 'asset-1', 'log-1', { findings: 'All good' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Maintenance Schedules
  // ═══════════════════════════════════════════════════════════════════════════
  describe('createSchedule', () => {
    it('should create a maintenance schedule', async () => {
      mockAssetsRepo.findOne.mockResolvedValue({ ...mockAsset, maintenanceLogs: [], maintenanceSchedules: [], depreciationLogs: [] });
      const mockSchedule = { id: 'sched-1', frequency: MaintenanceFrequency.MONTHLY };
      mockSchedulesRepo.create.mockReturnValue(mockSchedule);
      mockSchedulesRepo.save.mockResolvedValue(mockSchedule);

      const result = await service.createSchedule(adminUser, 'asset-1', {
        frequency: MaintenanceFrequency.MONTHLY,
        nextDueDate: '2026-10-01',
      });

      expect(result.frequency).toBe(MaintenanceFrequency.MONTHLY);
    });
  });

  describe('updateSchedule', () => {
    it('should throw NotFoundException for unknown schedule', async () => {
      mockAssetsRepo.findOne.mockResolvedValue({ ...mockAsset, maintenanceLogs: [], maintenanceSchedules: [], depreciationLogs: [] });
      mockSchedulesRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateSchedule(adminUser, 'asset-1', 'bad-sched', { isActive: false }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Depreciation
  // ═══════════════════════════════════════════════════════════════════════════
  describe('recordDepreciation', () => {
    it('should record depreciation and reduce currentValue', async () => {
      const assetWithValue = { ...mockAsset, currentValue: 450000, maintenanceLogs: [], maintenanceSchedules: [], depreciationLogs: [] };
      mockAssetsRepo.findOne.mockResolvedValue(assetWithValue);
      const mockEntry = {
        id: 'dep-1',
        depreciationAmount: 25000,
        bookValueAfter: 425000,
      };
      mockDepreciationRepo.create.mockReturnValue(mockEntry);
      mockDepreciationRepo.save.mockResolvedValue(mockEntry);
      mockAssetsRepo.save.mockResolvedValue({ ...assetWithValue, currentValue: 425000 });

      const result = await service.recordDepreciation(adminUser, 'asset-1', {
        depreciationDate: '2026-09-30',
        depreciationAmount: 25000,
        method: DepreciationMethod.STRAIGHT_LINE,
      });

      expect(result.depreciationAmount).toBe(25000);
      expect(result.bookValueAfter).toBe(425000);
      expect(mockAssetsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ currentValue: 425000 }),
      );
    });

    it('should throw BadRequestException when asset has no currentValue', async () => {
      mockAssetsRepo.findOne.mockResolvedValue({ ...mockAsset, currentValue: null, maintenanceLogs: [], maintenanceSchedules: [], depreciationLogs: [] });

      await expect(
        service.recordDepreciation(adminUser, 'asset-1', {
          depreciationDate: '2026-09-30',
          depreciationAmount: 25000,
          method: DepreciationMethod.STRAIGHT_LINE,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when depreciation exceeds currentValue', async () => {
      mockAssetsRepo.findOne.mockResolvedValue({ ...mockAsset, currentValue: 10000, maintenanceLogs: [], maintenanceSchedules: [], depreciationLogs: [] });

      await expect(
        service.recordDepreciation(adminUser, 'asset-1', {
          depreciationDate: '2026-09-30',
          depreciationAmount: 50000,
          method: DepreciationMethod.STRAIGHT_LINE,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getDepreciationLogs', () => {
    it('should return depreciation logs for an asset', async () => {
      mockAssetsRepo.findOne.mockResolvedValue({ ...mockAsset, maintenanceLogs: [], maintenanceSchedules: [], depreciationLogs: [] });
      mockDepreciationRepo.find.mockResolvedValue([{ id: 'dep-1', depreciationAmount: 25000 }]);

      const result = await service.getDepreciationLogs(adminUser, 'asset-1');
      expect(result).toHaveLength(1);
    });
  });
});
