import { Test, TestingModule } from '@nestjs/testing';
import { VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';
import { Role } from '../../common/enums/role.enum';
import { VendorCategory, VendorStatus, VendorInvoiceStatus } from '../../common/enums/vendor.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

describe('VendorsController', () => {
  let controller: VendorsController;

  const mockVendorsService = {
    createVendor: jest.fn(),
    findAllVendors: jest.fn(),
    findVendorById: jest.fn(),
    updateVendor: jest.fn(),
    deleteVendor: jest.fn(),
    createContract: jest.fn(),
    findAllContracts: jest.fn(),
    findContractById: jest.fn(),
    updateContract: jest.fn(),
    createAmcSchedule: jest.fn(),
    findAllAmcSchedules: jest.fn(),
    completeAmcVisit: jest.fn(),
    createInvoice: jest.fn(),
    findAllInvoices: jest.fn(),
    findInvoiceById: jest.fn(),
    approveInvoice: jest.fn(),
    recordPayment: jest.fn(),
    createReview: jest.fn(),
    findReviews: jest.fn(),
  };

  const adminUser: AuthUser = {
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
      controllers: [VendorsController],
      providers: [
        { provide: VendorsService, useValue: mockVendorsService },
      ],
    }).compile();

    controller = module.get<VendorsController>(VendorsController);
  });

  describe('createVendor', () => {
    it('should forward createVendor request to vendorsService', async () => {
      const dto = {
        name: 'Apex Elevators',
        category: VendorCategory.LIFT_AMC,
        contactPerson: 'Arun',
        email: 'arun@apex.in',
        phone: '+919876543210',
      };
      mockVendorsService.createVendor.mockResolvedValueOnce({ id: 'ven-1', ...dto });

      const res = await controller.createVendor(adminUser, dto);

      expect(res.id).toBe('ven-1');
      expect(mockVendorsService.createVendor).toHaveBeenCalledWith(adminUser, dto);
    });
  });

  describe('findAllVendors', () => {
    it('should list vendors for society', async () => {
      mockVendorsService.findAllVendors.mockResolvedValueOnce([{ id: 'ven-1' }]);

      const res = await controller.findAllVendors(adminUser, { status: VendorStatus.ACTIVE });

      expect(res).toHaveLength(1);
      expect(mockVendorsService.findAllVendors).toHaveBeenCalledWith(adminUser, {
        status: VendorStatus.ACTIVE,
      });
    });
  });

  describe('createContract', () => {
    it('should forward createContract request', async () => {
      const dto = {
        title: 'CCTV Security Maintenance',
        serviceCategory: VendorCategory.CCTV_SECURITY,
        startDate: '2026-06-01',
        endDate: '2027-05-31',
        contractValue: 120000,
      };
      mockVendorsService.createContract.mockResolvedValueOnce({ id: 'con-1', ...dto });

      const res = await controller.createContract(adminUser, 'ven-1', dto);

      expect(res.id).toBe('con-1');
      expect(mockVendorsService.createContract).toHaveBeenCalledWith(adminUser, 'ven-1', dto);
    });
  });

  describe('createInvoice & approveInvoice', () => {
    it('should forward createInvoice request', async () => {
      const dto = {
        invoiceNumber: 'INV-001',
        invoiceDate: '2026-06-01',
        dueDate: '2026-06-30',
        amount: 10000,
      };
      mockVendorsService.createInvoice.mockResolvedValueOnce({ id: 'inv-1', ...dto });

      const res = await controller.createInvoice(adminUser, 'ven-1', dto);

      expect(res.id).toBe('inv-1');
      expect(mockVendorsService.createInvoice).toHaveBeenCalledWith(adminUser, 'ven-1', dto);
    });

    it('should forward approveInvoice request', async () => {
      mockVendorsService.approveInvoice.mockResolvedValueOnce({
        id: 'inv-1',
        paymentStatus: VendorInvoiceStatus.APPROVED,
      });

      const res = await controller.approveInvoice(adminUser, 'inv-1', { notes: 'Approved' });

      expect(res.paymentStatus).toBe(VendorInvoiceStatus.APPROVED);
      expect(mockVendorsService.approveInvoice).toHaveBeenCalledWith(adminUser, 'inv-1', {
        notes: 'Approved',
      });
    });
  });

  describe('recordPayment', () => {
    it('should forward recordPayment request', async () => {
      const dto = { paidAmount: 10000, paymentReference: 'NEFT-12345' };
      mockVendorsService.recordPayment.mockResolvedValueOnce({
        id: 'inv-1',
        paymentStatus: VendorInvoiceStatus.PAID,
      });

      const res = await controller.recordPayment(adminUser, 'inv-1', dto);

      expect(res.paymentStatus).toBe(VendorInvoiceStatus.PAID);
      expect(mockVendorsService.recordPayment).toHaveBeenCalledWith(adminUser, 'inv-1', dto);
    });
  });

  describe('createReview', () => {
    it('should forward createReview request', async () => {
      const dto = { rating: 5, review: 'Great work!' };
      mockVendorsService.createReview.mockResolvedValueOnce({ id: 'rev-1', ...dto });

      const res = await controller.createReview(adminUser, 'ven-1', dto);

      expect(res.id).toBe('rev-1');
      expect(mockVendorsService.createReview).toHaveBeenCalledWith(adminUser, 'ven-1', dto);
    });
  });
});
