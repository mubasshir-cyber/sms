import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { Vendor } from './entities/vendor.entity';
import { VendorContract } from './entities/vendor-contract.entity';
import { VendorAmcSchedule } from './entities/vendor-amc-schedule.entity';
import { VendorInvoice } from './entities/vendor-invoice.entity';
import { VendorReview } from './entities/vendor-review.entity';
import { NotificationsService } from '../notifications/notifications.service';
import {
  VendorCategory,
  VendorStatus,
  ContractStatus,
  ContractBillingFrequency,
  AmcScheduleStatus,
  VendorInvoiceStatus,
} from '../../common/enums/vendor.enum';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

describe('VendorsService', () => {
  let service: VendorsService;

  const mockVendorsRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    softRemove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockContractsRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockAmcSchedulesRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockInvoicesRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockReviewsRepo = {
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

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VendorsService,
        { provide: getRepositoryToken(Vendor), useValue: mockVendorsRepo },
        { provide: getRepositoryToken(VendorContract), useValue: mockContractsRepo },
        { provide: getRepositoryToken(VendorAmcSchedule), useValue: mockAmcSchedulesRepo },
        { provide: getRepositoryToken(VendorInvoice), useValue: mockInvoicesRepo },
        { provide: getRepositoryToken(VendorReview), useValue: mockReviewsRepo },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<VendorsService>(VendorsService);
  });

  describe('Vendor Profiles', () => {
    it('should create a new vendor in society (happy path)', async () => {
      mockVendorsRepo.findOne.mockResolvedValueOnce(null);
      const mockCreated = {
        id: 'ven-1',
        name: 'LiftCo India',
        category: VendorCategory.LIFT_AMC,
        societyId: 'soc-100',
        rating: 0.0,
        ratingCount: 0,
      };
      mockVendorsRepo.create.mockReturnValue(mockCreated);
      mockVendorsRepo.save.mockResolvedValue(mockCreated);

      const dto = {
        name: 'LiftCo India',
        category: VendorCategory.LIFT_AMC,
        contactPerson: 'Rajesh',
        email: 'rajesh@liftco.in',
        phone: '+919876543210',
      };

      const result = await service.createVendor(adminUser, dto);

      expect(result.id).toBe('ven-1');
      expect(mockVendorsRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException on duplicate email or phone in same society', async () => {
      mockVendorsRepo.findOne.mockResolvedValueOnce({ id: 'ven-existing', email: 'rajesh@liftco.in' });

      const dto = {
        name: 'LiftCo India Duplicate',
        category: VendorCategory.LIFT_AMC,
        contactPerson: 'Rajesh',
        email: 'rajesh@liftco.in',
        phone: '+919876543210',
      };

      await expect(service.createVendor(adminUser, dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('Contracts & AMC Lifecycle', () => {
    it('should create contract with sequential number and rounded value', async () => {
      mockVendorsRepo.findOne.mockResolvedValueOnce({ id: 'ven-1', societyId: 'soc-100' });
      mockContractsRepo.count.mockResolvedValueOnce(4); // 4th contract -> CON-2026-005

      const mockContract = {
        id: 'con-1',
        contractNumber: 'CON-2026-005',
        contractValue: 300000.5,
        status: ContractStatus.ACTIVE,
      };
      mockContractsRepo.create.mockReturnValue(mockContract);
      mockContractsRepo.save.mockResolvedValue(mockContract);

      const dto = {
        title: 'Annual Lift AMC',
        serviceCategory: VendorCategory.LIFT_AMC,
        startDate: '2026-04-01',
        endDate: '2027-03-31',
        contractValue: 300000.504, // should round to 300000.50
      };

      const result = await service.createContract(adminUser, 'ven-1', dto);

      expect(result.id).toBe('con-1');
      expect(result.contractNumber).toBe('CON-2026-005');
      expect(mockContractsRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if endDate is before startDate', async () => {
      mockVendorsRepo.findOne.mockResolvedValueOnce({ id: 'ven-1', societyId: 'soc-100' });

      const dto = {
        title: 'Invalid Date Contract',
        serviceCategory: VendorCategory.ELECTRICAL,
        startDate: '2026-10-01',
        endDate: '2026-05-01', // Invalid: before start date
        contractValue: 10000,
      };

      await expect(service.createContract(adminUser, 'ven-1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('AMC Schedules', () => {
    it('should create and complete an AMC visit schedule', async () => {
      mockContractsRepo.findOne.mockResolvedValueOnce({
        id: 'con-1',
        societyId: 'soc-100',
        vendorId: 'ven-1',
      });

      const mockSchedule = {
        id: 'amc-1',
        scheduledDate: new Date('2026-06-15'),
        serviceType: 'Quarterly Checkup',
        status: AmcScheduleStatus.SCHEDULED,
      };
      mockAmcSchedulesRepo.create.mockReturnValue(mockSchedule);
      mockAmcSchedulesRepo.save.mockImplementation(async (s) => s);

      const created = await service.createAmcSchedule(adminUser, 'con-1', {
        scheduledDate: '2026-06-15',
        serviceType: 'Quarterly Checkup',
      });
      expect(created.id).toBe('amc-1');

      // Complete visit
      mockAmcSchedulesRepo.findOne.mockResolvedValueOnce({
        id: 'amc-1',
        societyId: 'soc-100',
        status: AmcScheduleStatus.SCHEDULED,
      });

      const completed = await service.completeAmcVisit(adminUser, 'amc-1', {
        serviceReportUrl: 'https://s3.amazonaws.com/sms/reports/amc-1.pdf',
        technicianName: 'Sunil',
      });

      expect(completed.status).toBe(AmcScheduleStatus.COMPLETED);
      expect(completed.serviceReportUrl).toBe('https://s3.amazonaws.com/sms/reports/amc-1.pdf');
    });
  });

  describe('Invoices & Financial Precision', () => {
    it('should create invoice calculating 2-decimal rounded totalAmount', async () => {
      mockVendorsRepo.findOne.mockResolvedValueOnce({ id: 'ven-1', societyId: 'soc-100' });

      mockInvoicesRepo.create.mockImplementation((inv) => ({ id: 'inv-1', ...inv }));
      mockInvoicesRepo.save.mockImplementation(async (inv) => inv);

      const dto = {
        invoiceNumber: 'INV-LIFT-001',
        invoiceDate: '2026-05-01',
        dueDate: '2026-05-31',
        amount: 25000.456, // rounds to 25000.46
        taxAmount: 4500.082, // rounds to 4500.08 -> total 29500.54
      };

      const invoice = await service.createInvoice(adminUser, 'ven-1', dto);

      expect(invoice.amount).toBe(25000.46);
      expect(invoice.taxAmount).toBe(4500.08);
      expect(invoice.totalAmount).toBe(29500.54);
      expect(invoice.paymentStatus).toBe(VendorInvoiceStatus.PENDING_APPROVAL);
    });

    it('should approve invoice and record payment transitioning status to PAID', async () => {
      const mockInvoice = {
        id: 'inv-1',
        societyId: 'soc-100',
        amount: 25000,
        taxAmount: 4500,
        totalAmount: 29500,
        paymentStatus: VendorInvoiceStatus.PENDING_APPROVAL,
        paidAmount: 0,
      };

      mockInvoicesRepo.findOne.mockResolvedValue(mockInvoice);
      mockInvoicesRepo.save.mockImplementation(async (inv) => inv);

      // Approve
      const approved = await service.approveInvoice(adminUser, 'inv-1', {
        notes: 'Passed verification',
      });
      expect(approved.paymentStatus).toBe(VendorInvoiceStatus.APPROVED);

      // Full Payment
      const paid = await service.recordPayment(adminUser, 'inv-1', {
        paidAmount: 29500,
        paymentReference: 'UTR-NEFT-999',
      });

      expect(paid.paymentStatus).toBe(VendorInvoiceStatus.PAID);
      expect(paid.paidAmount).toBe(29500);
      expect(paid.paymentReference).toBe('UTR-NEFT-999');
    });

    it('should set status to PARTIALLY_PAID if payment is less than totalAmount', async () => {
      const mockInvoice = {
        id: 'inv-2',
        societyId: 'soc-100',
        totalAmount: 50000,
        paidAmount: 0,
        paymentStatus: VendorInvoiceStatus.APPROVED,
      };

      mockInvoicesRepo.findOne.mockResolvedValueOnce(mockInvoice);
      mockInvoicesRepo.save.mockImplementation(async (inv) => inv);

      const partial = await service.recordPayment(adminUser, 'inv-2', {
        paidAmount: 20000,
        paymentReference: 'PARTIAL-001',
      });

      expect(partial.paymentStatus).toBe(VendorInvoiceStatus.PARTIALLY_PAID);
      expect(partial.paidAmount).toBe(20000);
    });
  });

  describe('Vendor Reviews & Ratings', () => {
    it('should save review and compute rolling average rating on vendor', async () => {
      const mockVendor = {
        id: 'ven-1',
        societyId: 'soc-100',
        rating: 4.0,
        ratingCount: 2, // 2 reviews: 4.0 * 2 = 8
      };
      mockVendorsRepo.findOne.mockResolvedValueOnce(mockVendor);
      mockReviewsRepo.create.mockImplementation((r) => ({ id: 'rev-1', ...r }));
      mockReviewsRepo.save.mockImplementation(async (r) => r);
      mockVendorsRepo.save.mockImplementation(async (v) => v);

      // Add a 5-star review: (8 + 5) / 3 = 4.33
      await service.createReview(adminUser, 'ven-1', {
        rating: 5,
        review: 'Excellent lift servicing!',
      });

      expect(mockVendor.rating).toBe(4.33);
      expect(mockVendor.ratingCount).toBe(3);
      expect(mockVendorsRepo.save).toHaveBeenCalledWith(mockVendor);
    });
  });

  describe('Contract Expiry Automated Alerts', () => {
    it('should identify contracts expiring in 30 days and trigger notifications', async () => {
      const today = new Date();
      const in30Days = new Date(today);
      in30Days.setDate(today.getDate() + 30);

      const mockContract = {
        id: 'con-alert',
        societyId: 'soc-100',
        title: 'Security CCTV AMC',
        contractNumber: 'CON-2025-010',
        status: ContractStatus.ACTIVE,
        endDate: in30Days,
        renewalReminderDays: [30, 15, 7],
        vendor: { name: 'SecureEye Systems' },
      };

      mockContractsRepo.find.mockResolvedValueOnce([mockContract]);
      mockContractsRepo.save.mockImplementation(async (c) => c);

      const result = await service.checkContractExpiries();

      expect(result.checked).toBe(1);
      expect(result.alerted).toBe(1);
      expect(mockNotificationsService.send).toHaveBeenCalled();
    });
  });
});
