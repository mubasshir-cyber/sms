import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { ExpenseCategory, Expense, BankAccount } from './entities/expense.entity';

describe('ExpensesService', () => {
  let service: ExpensesService;

  const mockCatRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    softRemove: jest.fn(),
  };

  const mockExpRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    softRemove: jest.fn(),
  };

  const mockBankRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const societyId = 'soc-123';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        { provide: getRepositoryToken(ExpenseCategory), useValue: mockCatRepo },
        { provide: getRepositoryToken(Expense), useValue: mockExpRepo },
        { provide: getRepositoryToken(BankAccount), useValue: mockBankRepo },
      ],
    }).compile();

    service = module.get<ExpensesService>(ExpensesService);
  });

  describe('Categories', () => {
    it('should create expense category within society (happy path)', async () => {
      mockCatRepo.findOne.mockResolvedValueOnce(null);
      const mockCat = { id: 'cat-1', name: 'Security Services', societyId };
      mockCatRepo.create.mockReturnValue(mockCat);
      mockCatRepo.save.mockResolvedValue(mockCat);

      const res = await service.createCategory(societyId, { name: 'Security Services' });

      expect(res.id).toBe('cat-1');
      expect(mockCatRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException on duplicate category name in society', async () => {
      mockCatRepo.findOne.mockResolvedValueOnce({ id: 'cat-existing' });

      await expect(
        service.createCategory(societyId, { name: 'Security Services' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Expenses & Approvals', () => {
    it('should create expense after validating category belongs to society', async () => {
      mockCatRepo.findOne.mockResolvedValueOnce({ id: 'cat-1', societyId });
      const mockExp = { id: 'exp-1', amount: 1500, categoryId: 'cat-1', societyId };
      mockExpRepo.create.mockReturnValue(mockExp);
      mockExpRepo.save.mockResolvedValue(mockExp);

      const dto = {
        categoryId: 'cat-1',
        amount: 1500,
        expenseDate: '2026-09-01',
        description: 'Monthly Gardening',
      };

      const res = await service.createExpense(societyId, dto as any, 'admin-1');

      expect(res.id).toBe('exp-1');
      expect(mockExpRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if category does not belong to society (tenant isolation)', async () => {
      mockCatRepo.findOne.mockResolvedValueOnce(null);

      const dto = { categoryId: 'cat-foreign', amount: 500, expenseDate: '2026-09-01', description: 'Test' };

      await expect(service.createExpense(societyId, dto as any, 'admin-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should approve expense and record approver', async () => {
      const mockExpense = {
        id: 'exp-1',
        societyId,
        amount: 1000,
        isApproved: false,
        approvedByUserId: null,
      };
      mockExpRepo.findOne.mockResolvedValueOnce(mockExpense);
      mockExpRepo.save.mockImplementation(async (e) => e);

      const approved = await service.approveExpense(societyId, 'exp-1', 'admin-super');

      expect(approved.isApproved).toBe(true);
      expect(approved.approvedByUserId).toBe('admin-super');
      expect(mockExpRepo.save).toHaveBeenCalled();
    });
  });
});
