import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

describe('ExpensesController', () => {
  let controller: ExpensesController;

  const mockExpensesService = {
    createCategory: jest.fn(),
    findAllCategories: jest.fn(),
    createExpense: jest.fn(),
    findAllExpenses: jest.fn(),
    approveExpense: jest.fn(),
    getSummary: jest.fn(),
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
      controllers: [ExpensesController],
      providers: [
        { provide: ExpensesService, useValue: mockExpensesService },
      ],
    }).compile();

    controller = module.get<ExpensesController>(ExpensesController);
  });

  describe('createExpense', () => {
    it('should forward createExpense with user societyId and sub', async () => {
      const dto = { amount: 500 } as any;
      mockExpensesService.createExpense.mockResolvedValueOnce({ id: 'exp-1' });

      const res = await controller.createExpense(dto, dummyUser);

      expect(res.id).toBe('exp-1');
      expect(mockExpensesService.createExpense).toHaveBeenCalledWith('soc-1', dto, 'admin-1');
    });
  });

  describe('approve', () => {
    it('should call approve with admin sub', async () => {
      mockExpensesService.approveExpense.mockResolvedValueOnce({ id: 'exp-1', isApproved: true });

      const res = await controller.approve('exp-1', dummyUser);

      expect(res.isApproved).toBe(true);
      expect(mockExpensesService.approveExpense).toHaveBeenCalledWith('soc-1', 'exp-1', 'admin-1');
    });
  });
});
