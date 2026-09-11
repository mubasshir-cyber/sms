import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceHead } from './entities/maintenance-head.entity';
import { BillingRule } from './entities/billing-rule.entity';
import { LateFeeConfig } from './entities/late-fee-config.entity';
import { Invoice } from './entities/invoice.entity';
import { StructureService } from '../structure/structure.service';
import { SocietiesService } from '../societies/societies.service';
import { BillingRuleType, InvoiceStatus } from '../../common/enums/billing.enum';
import { UnitType } from '../../common/enums/unit-type.enum';

describe('MaintenanceService', () => {
  let service: MaintenanceService;

  const mockHeadsRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    softRemove: jest.fn(),
  };

  const mockRulesRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    softRemove: jest.fn(),
  };

  const mockLateFeeRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockInvoicesRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockStructureService = {
    findAllUnits: jest.fn(),
  };

  const mockSocietiesService = {
    findOneInternal: jest.fn(),
  };

  const societyId = 'soc-123';

  beforeEach(async () => {
    jest.clearAllMocks();
    mockSocietiesService.findOneInternal.mockResolvedValue({
      id: societyId,
      settings: { billingDay: 1 },
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaintenanceService,
        { provide: getRepositoryToken(MaintenanceHead), useValue: mockHeadsRepo },
        { provide: getRepositoryToken(BillingRule), useValue: mockRulesRepo },
        { provide: getRepositoryToken(LateFeeConfig), useValue: mockLateFeeRepo },
        { provide: getRepositoryToken(Invoice), useValue: mockInvoicesRepo },
        { provide: StructureService, useValue: mockStructureService },
        { provide: SocietiesService, useValue: mockSocietiesService },
      ],
    }).compile();

    service = module.get<MaintenanceService>(MaintenanceService);
  });

  describe('Maintenance Heads', () => {
    it('should create a maintenance head within society (happy path)', async () => {
      mockHeadsRepo.findOne.mockResolvedValueOnce(null);
      const mockHead = { id: 'head-1', name: 'Water Charges', societyId };
      mockHeadsRepo.create.mockReturnValue(mockHead);
      mockHeadsRepo.save.mockResolvedValue(mockHead);

      const res = await service.createHead(societyId, { name: 'Water Charges' } as any);

      expect(res.id).toBe('head-1');
      expect(mockHeadsRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException on duplicate head name in same society', async () => {
      mockHeadsRepo.findOne.mockResolvedValueOnce({ id: 'head-existing', name: 'Water Charges' });

      await expect(
        service.createHead(societyId, { name: 'Water Charges' } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Invoice Generation & Financial Precision', () => {
    it('should generate invoices calculating accurate rounded subtotal and line items', async () => {
      mockStructureService.findAllUnits.mockResolvedValueOnce([
        { id: 'u-1', type: UnitType.TWO_BHK, sqFt: 1045.5 },
      ]);
      mockRulesRepo.find.mockResolvedValueOnce([
        {
          id: 'rule-1',
          headId: 'head-1',
          ruleType: BillingRuleType.PER_SQFT,
          amount: '2.35', // 1045.5 * 2.35 = 2456.925 -> 2456.93 rounded
          unitType: null,
          effectiveFrom: new Date('2026-01-01'),
          effectiveTo: null,
        },
      ]);
      mockHeadsRepo.find.mockResolvedValueOnce([
        { id: 'head-1', name: 'Service Maintenance' },
      ]);
      mockInvoicesRepo.findOne
        .mockResolvedValueOnce(null)  // last invoice check
        .mockResolvedValueOnce(null); // unit not already invoiced
      mockInvoicesRepo.create.mockImplementation((inv) => ({ id: 'inv-1', ...inv }));
      mockInvoicesRepo.save.mockImplementation(async (inv) => inv);

      const result = await service.generateInvoices(societyId, {
        month: 9,
        year: 2026,
        dueDays: 15,
      });

      expect(result.generated).toBe(1);
      expect(result.invoices[0].totalAmount).toBe(2456.93);
      expect(result.invoices[0].lineItems[0].amount).toBe(2456.93);
    });

    it('should skip units already invoiced for the specified month/year (idempotent)', async () => {
      mockRulesRepo.find.mockResolvedValueOnce([
        {
          id: 'rule-1',
          headId: 'head-1',
          ruleType: BillingRuleType.FIXED,
          amount: '500',
          unitType: null,
          effectiveFrom: new Date('2026-01-01'),
        },
      ]);
      mockHeadsRepo.find.mockResolvedValueOnce([
        { id: 'head-1', name: 'Maintenance' },
      ]);
      mockStructureService.findAllUnits.mockResolvedValueOnce([
        { id: 'u-1', type: UnitType.TWO_BHK, sqFt: 1000 },
      ]);
      mockInvoicesRepo.findOne
        .mockResolvedValueOnce(null) // lastInvoice sequence check
        .mockResolvedValueOnce({ id: 'already-billed' }); // already invoiced for this month/year

      const result = await service.generateInvoices(societyId, {
        month: 9,
        year: 2026,
      });

      expect(result.generated).toBe(0);
      expect(result.skipped).toBe(1);
    });
  });
});
