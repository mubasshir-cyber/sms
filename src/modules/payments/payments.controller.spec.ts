import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

describe('PaymentsController', () => {
  let controller: PaymentsController;

  const mockPaymentsService = {
    createOrder: jest.fn(),
    handleWebhook: jest.fn(),
    recordManual: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    getReceiptPdf: jest.fn(),
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
      controllers: [PaymentsController],
      providers: [
        { provide: PaymentsService, useValue: mockPaymentsService },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
  });

  describe('createOrder', () => {
    it('should forward createOrder request', async () => {
      const dto = { invoiceId: 'inv-1' } as any;
      mockPaymentsService.createOrder.mockResolvedValueOnce({ orderId: 'ord_1' });

      const res = await controller.createOrder(dto, dummyUser);

      expect(res.orderId).toBe('ord_1');
      expect(mockPaymentsService.createOrder).toHaveBeenCalledWith('soc-1', dto);
    });
  });

  describe('findAll', () => {
    it('should list payments for society', async () => {
      mockPaymentsService.findAll.mockResolvedValueOnce([{ id: 'p-1' }]);

      const res = await controller.findAll(dummyUser);

      expect(res).toHaveLength(1);
      expect(mockPaymentsService.findAll).toHaveBeenCalledWith('soc-1', {
        invoiceId: undefined,
        unitId: undefined,
        status: undefined,
      });
    });
  });
});
