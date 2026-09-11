import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { RazorpayService } from './razorpay.service';
import { MaintenanceService } from '../maintenance/maintenance.service';
import { PdfService } from '../../common/services/pdf.service';
import { SocietiesService } from '../societies/societies.service';
import { PaymentMethod, PaymentStatus } from '../../common/enums/payment.enum';
import { InvoiceStatus } from '../../common/enums/billing.enum';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const mockPaymentsRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
  };

  const mockRazorpayService = {
    createOrder: jest.fn(),
    verifySignature: jest.fn(),
  };

  const mockMaintenanceService = {
    findOneInvoice: jest.fn(),
    markInvoicePaid: jest.fn(),
    findAllInvoices: jest.fn(),
  };

  const mockPdfService = {
    generateReceiptPdf: jest.fn(),
  };

  const mockSocietiesService = {
    findOneInternal: jest.fn(),
  };

  const societyId = 'soc-123';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: getRepositoryToken(Payment), useValue: mockPaymentsRepo },
        { provide: RazorpayService, useValue: mockRazorpayService },
        { provide: MaintenanceService, useValue: mockMaintenanceService },
        { provide: PdfService, useValue: mockPdfService },
        { provide: SocietiesService, useValue: mockSocietiesService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  describe('createOrder', () => {
    it('should create Razorpay order for unpaid invoice (happy path)', async () => {
      mockMaintenanceService.findOneInvoice.mockResolvedValueOnce({
        id: 'inv-1',
        totalAmount: '2500.00',
        status: InvoiceStatus.PENDING,
        invoiceNumber: 'INV-2026-0001',
        unitId: 'unit-1',
      });
      mockRazorpayService.createOrder.mockResolvedValueOnce({
        id: 'order_123',
        amount: 250000,
        currency: 'INR',
      });
      mockPaymentsRepo.create.mockReturnValue({ id: 'pay-pending' });
      mockPaymentsRepo.save.mockResolvedValue({ id: 'pay-pending' });

      const res = await service.createOrder(societyId, { invoiceId: 'inv-1' } as any);

      expect(res).toEqual(
        expect.objectContaining({
          orderId: 'order_123',
          amount: 250000,
          invoiceId: 'inv-1',
        }),
      );
    });

    it('should reject payment order creation if invoice is already paid', async () => {
      mockMaintenanceService.findOneInvoice.mockResolvedValueOnce({
        id: 'inv-1',
        status: InvoiceStatus.PAID,
      });

      await expect(
        service.createOrder(societyId, { invoiceId: 'inv-1' } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('handleWebhook', () => {
    it('should confirm payment on valid signature and mark invoice paid (happy path)', async () => {
      mockRazorpayService.verifySignature.mockReturnValueOnce(true);
      const mockPayment = {
        id: 'pay-1',
        invoiceId: 'inv-1',
        societyId,
        gatewayOrderId: 'order_123',
        status: PaymentStatus.PENDING,
      };
      mockPaymentsRepo.findOne.mockResolvedValueOnce(mockPayment);
      mockPaymentsRepo.count.mockResolvedValueOnce(5); // 5 prior receipts
      mockPaymentsRepo.save.mockImplementation(async (p) => p);

      const result = await service.handleWebhook(societyId, 'order_123', 'pay_xyz', 'valid_sig');

      expect(result.status).toBe(PaymentStatus.SUCCESS);
      expect(result.receiptNumber).toMatch(/^RCP-\d{4}-0006$/);
      expect(mockMaintenanceService.markInvoicePaid).toHaveBeenCalledWith('inv-1', expect.any(Date));
    });

    it('should reject webhook with invalid signature', async () => {
      mockRazorpayService.verifySignature.mockReturnValueOnce(false);

      await expect(
        service.handleWebhook(societyId, 'order_123', 'pay_xyz', 'bad_sig'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('recordManual', () => {
    it('should record cash payment and mark invoice paid', async () => {
      mockMaintenanceService.findOneInvoice.mockResolvedValueOnce({
        id: 'inv-1',
        unitId: 'unit-1',
        status: InvoiceStatus.PENDING,
      });
      mockPaymentsRepo.count.mockResolvedValueOnce(2);
      mockPaymentsRepo.create.mockImplementation((p) => ({ id: 'pay-manual', ...p }));
      mockPaymentsRepo.save.mockImplementation(async (p) => p);

      const dto = {
        invoiceId: 'inv-1',
        amount: 2500,
        method: PaymentMethod.CASH,
        notes: 'Paid at society office',
      };

      const result = await service.recordManual(societyId, dto as any, 'user-admin');

      expect(result.status).toBe(PaymentStatus.SUCCESS);
      expect(result.receiptNumber).toBe(`RCP-${new Date().getFullYear()}-0003`);
      expect(mockMaintenanceService.markInvoicePaid).toHaveBeenCalled();
    });
  });
});
