import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual, ILike } from 'typeorm';
import { Vendor } from './entities/vendor.entity';
import { VendorContract } from './entities/vendor-contract.entity';
import { VendorAmcSchedule } from './entities/vendor-amc-schedule.entity';
import { VendorInvoice } from './entities/vendor-invoice.entity';
import { VendorReview } from './entities/vendor-review.entity';
import {
  CreateVendorDto,
  UpdateVendorDto,
  VendorQueryDto,
  CreateVendorContractDto,
  UpdateVendorContractDto,
  ContractQueryDto,
  CreateAmcScheduleDto,
  UpdateAmcScheduleDto,
  CompleteAmcVisitDto,
  CreateVendorInvoiceDto,
  ApproveVendorInvoiceDto,
  RecordVendorPaymentDto,
  CreateVendorReviewDto,
} from './dto/vendors.dto';
import {
  VendorStatus,
  ContractStatus,
  AmcScheduleStatus,
  VendorInvoiceStatus,
} from '../../common/enums/vendor.enum';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationChannel } from '../../common/enums/notification.enum';

@Injectable()
export class VendorsService {
  private readonly logger = new Logger(VendorsService.name);

  constructor(
    @InjectRepository(Vendor)
    private readonly vendorsRepo: Repository<Vendor>,
    @InjectRepository(VendorContract)
    private readonly contractsRepo: Repository<VendorContract>,
    @InjectRepository(VendorAmcSchedule)
    private readonly amcSchedulesRepo: Repository<VendorAmcSchedule>,
    @InjectRepository(VendorInvoice)
    private readonly invoicesRepo: Repository<VendorInvoice>,
    @InjectRepository(VendorReview)
    private readonly reviewsRepo: Repository<VendorReview>,
    private readonly notificationsService: NotificationsService,
  ) {}

  private getSocietyId(user: AuthUser): string {
    if (!user.societyId && user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('User is not associated with any society');
    }
    return user.societyId as string;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏢 VENDOR PROFILES
  // ═══════════════════════════════════════════════════════════════════════════

  async createVendor(user: AuthUser, dto: CreateVendorDto): Promise<Vendor> {
    const societyId = this.getSocietyId(user);

    // Check for duplicate phone or email in same society
    const existing = await this.vendorsRepo.findOne({
      where: [
        { societyId, email: dto.email },
        { societyId, phone: dto.phone },
      ],
    });

    if (existing) {
      throw new ConflictException(
        `A vendor with email '${dto.email}' or phone '${dto.phone}' already exists in this society`,
      );
    }

    const vendor = this.vendorsRepo.create({
      ...dto,
      societyId,
      status: VendorStatus.ACTIVE,
      rating: 0.0,
      ratingCount: 0,
    });

    return this.vendorsRepo.save(vendor);
  }

  async findAllVendors(user: AuthUser, query?: VendorQueryDto): Promise<Vendor[]> {
    const societyId = this.getSocietyId(user);

    const qb = this.vendorsRepo
      .createQueryBuilder('v')
      .where('v.societyId = :societyId', { societyId });

    // Restrict VENDOR role to their own vendor record
    if (user.role === Role.VENDOR && user.vendorId) {
      qb.andWhere('v.id = :vendorId', { vendorId: user.vendorId });
    }

    if (query?.category) {
      qb.andWhere('v.category = :category', { category: query.category });
    }

    if (query?.status) {
      qb.andWhere('v.status = :status', { status: query.status });
    }

    if (query?.search) {
      qb.andWhere(
        '(v.name ILIKE :search OR v.contactPerson ILIKE :search OR v.email ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    return qb.orderBy('v.name', 'ASC').getMany();
  }

  async findVendorById(user: AuthUser, id: string): Promise<Vendor> {
    const societyId = this.getSocietyId(user);

    // VENDOR role check
    if (user.role === Role.VENDOR && user.vendorId && user.vendorId !== id) {
      throw new ForbiddenException('Vendors can only access their own profile');
    }

    const vendor = await this.vendorsRepo.findOne({
      where: { id, societyId },
      relations: ['contracts', 'invoices', 'reviews'],
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor with ID '${id}' not found in society`);
    }

    return vendor;
  }

  async updateVendor(user: AuthUser, id: string, dto: UpdateVendorDto): Promise<Vendor> {
    const vendor = await this.findVendorById(user, id);
    Object.assign(vendor, dto);
    return this.vendorsRepo.save(vendor);
  }

  async deleteVendor(user: AuthUser, id: string): Promise<{ success: boolean }> {
    const vendor = await this.findVendorById(user, id);
    await this.vendorsRepo.softRemove(vendor);
    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📜 CONTRACTS & AMC AGREEMENTS
  // ═══════════════════════════════════════════════════════════════════════════

  private async generateContractNumber(societyId: string): Promise<string> {
    const currentYear = new Date().getFullYear();
    const count = await this.contractsRepo.count({
      where: { societyId },
    });
    const seq = (count + 1).toString().padStart(3, '0');
    return `CON-${currentYear}-${seq}`;
  }

  async createContract(
    user: AuthUser,
    vendorId: string,
    dto: CreateVendorContractDto,
  ): Promise<VendorContract> {
    const societyId = this.getSocietyId(user);
    const vendor = await this.findVendorById(user, vendorId);

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException('Contract end date must be after start date');
    }

    const contractNumber = await this.generateContractNumber(societyId);
    const contractValue = Math.round(Number(dto.contractValue) * 100) / 100;

    const contract = this.contractsRepo.create({
      ...dto,
      societyId,
      vendorId: vendor.id,
      contractNumber,
      contractValue,
      startDate,
      endDate,
      status: ContractStatus.ACTIVE,
      renewalReminderDays: dto.renewalReminderDays ?? [30, 15, 7],
    });

    return this.contractsRepo.save(contract);
  }

  async findAllContracts(
    user: AuthUser,
    vendorId?: string,
    query?: ContractQueryDto,
  ): Promise<VendorContract[]> {
    const societyId = this.getSocietyId(user);

    const qb = this.contractsRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.vendor', 'vendor')
      .where('c.societyId = :societyId', { societyId });

    if (user.role === Role.VENDOR && user.vendorId) {
      qb.andWhere('c.vendorId = :vendorId', { vendorId: user.vendorId });
    } else if (vendorId) {
      qb.andWhere('c.vendorId = :vendorId', { vendorId });
    }

    if (query?.status) {
      qb.andWhere('c.status = :status', { status: query.status });
    }

    if (query?.serviceCategory) {
      qb.andWhere('c.serviceCategory = :serviceCategory', {
        serviceCategory: query.serviceCategory,
      });
    }

    return qb.orderBy('c.endDate', 'ASC').getMany();
  }

  async findContractById(user: AuthUser, id: string): Promise<VendorContract> {
    const societyId = this.getSocietyId(user);

    const contract = await this.contractsRepo.findOne({
      where: { id, societyId },
      relations: ['vendor', 'amcSchedules', 'invoices'],
    });

    if (!contract) {
      throw new NotFoundException(`Vendor contract with ID '${id}' not found`);
    }

    if (user.role === Role.VENDOR && user.vendorId && contract.vendorId !== user.vendorId) {
      throw new ForbiddenException('Vendors can only view their own contracts');
    }

    return contract;
  }

  async updateContract(
    user: AuthUser,
    id: string,
    dto: UpdateVendorContractDto,
  ): Promise<VendorContract> {
    const contract = await this.findContractById(user, id);

    if (dto.startDate && dto.endDate) {
      if (new Date(dto.endDate) <= new Date(dto.startDate)) {
        throw new BadRequestException('Contract end date must be after start date');
      }
    }

    if (dto.contractValue !== undefined) {
      dto.contractValue = Math.round(Number(dto.contractValue) * 100) / 100;
    }

    Object.assign(contract, {
      ...dto,
      startDate: dto.startDate ? new Date(dto.startDate) : contract.startDate,
      endDate: dto.endDate ? new Date(dto.endDate) : contract.endDate,
    });

    return this.contractsRepo.save(contract);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔧 AMC SCHEDULES & ROUTINE VISITS
  // ═══════════════════════════════════════════════════════════════════════════

  async createAmcSchedule(
    user: AuthUser,
    contractId: string,
    dto: CreateAmcScheduleDto,
  ): Promise<VendorAmcSchedule> {
    const societyId = this.getSocietyId(user);
    const contract = await this.findContractById(user, contractId);

    const schedule = this.amcSchedulesRepo.create({
      ...dto,
      societyId,
      contractId: contract.id,
      vendorId: contract.vendorId,
      scheduledDate: new Date(dto.scheduledDate),
      status: AmcScheduleStatus.SCHEDULED,
    });

    return this.amcSchedulesRepo.save(schedule);
  }

  async findAllAmcSchedules(
    user: AuthUser,
    contractId?: string,
  ): Promise<VendorAmcSchedule[]> {
    const societyId = this.getSocietyId(user);

    const where: any = { societyId };
    if (contractId) where.contractId = contractId;

    if (user.role === Role.VENDOR && user.vendorId) {
      where.vendorId = user.vendorId;
    }

    return this.amcSchedulesRepo.find({
      where,
      order: { scheduledDate: 'ASC' },
      relations: ['vendor', 'contract'],
    });
  }

  async completeAmcVisit(
    user: AuthUser,
    scheduleId: string,
    dto: CompleteAmcVisitDto,
  ): Promise<VendorAmcSchedule> {
    const societyId = this.getSocietyId(user);

    const schedule = await this.amcSchedulesRepo.findOne({
      where: { id: scheduleId, societyId },
    });

    if (!schedule) {
      throw new NotFoundException(`AMC schedule with ID '${scheduleId}' not found`);
    }

    schedule.status = AmcScheduleStatus.COMPLETED;
    schedule.completedAt = new Date();
    if (dto.serviceReportUrl) schedule.serviceReportUrl = dto.serviceReportUrl;
    if (dto.technicianName) schedule.technicianName = dto.technicianName;
    if (dto.technicianPhone) schedule.technicianPhone = dto.technicianPhone;
    if (dto.notes) schedule.notes = dto.notes;

    return this.amcSchedulesRepo.save(schedule);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🧾 INVOICES & PAYMENTS
  // ═══════════════════════════════════════════════════════════════════════════

  async createInvoice(
    user: AuthUser,
    vendorId: string,
    dto: CreateVendorInvoiceDto,
  ): Promise<VendorInvoice> {
    const societyId = this.getSocietyId(user);
    const vendor = await this.findVendorById(user, vendorId);

    if (dto.contractId) {
      await this.findContractById(user, dto.contractId);
    }

    // 3-Level Financial Arithmetic: Round amount, tax, and total
    const amount = Math.round(Number(dto.amount) * 100) / 100;
    const taxAmount = Math.round(Number(dto.taxAmount ?? 0) * 100) / 100;
    const totalAmount = Math.round((amount + taxAmount) * 100) / 100;

    const invoice = this.invoicesRepo.create({
      ...dto,
      societyId,
      vendorId: vendor.id,
      amount,
      taxAmount,
      totalAmount,
      invoiceDate: new Date(dto.invoiceDate),
      dueDate: new Date(dto.dueDate),
      paymentStatus: VendorInvoiceStatus.PENDING_APPROVAL,
      paidAmount: 0.0,
    });

    return this.invoicesRepo.save(invoice);
  }

  async findAllInvoices(
    user: AuthUser,
    vendorId?: string,
    status?: VendorInvoiceStatus,
  ): Promise<VendorInvoice[]> {
    const societyId = this.getSocietyId(user);

    const qb = this.invoicesRepo
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.vendor', 'vendor')
      .leftJoinAndSelect('inv.contract', 'contract')
      .where('inv.societyId = :societyId', { societyId });

    if (user.role === Role.VENDOR && user.vendorId) {
      qb.andWhere('inv.vendorId = :vendorId', { vendorId: user.vendorId });
    } else if (vendorId) {
      qb.andWhere('inv.vendorId = :vendorId', { vendorId });
    }

    if (status) {
      qb.andWhere('inv.paymentStatus = :status', { status });
    }

    return qb.orderBy('inv.dueDate', 'ASC').getMany();
  }

  async findInvoiceById(user: AuthUser, id: string): Promise<VendorInvoice> {
    const societyId = this.getSocietyId(user);

    const invoice = await this.invoicesRepo.findOne({
      where: { id, societyId },
      relations: ['vendor', 'contract', 'approvedByUser'],
    });

    if (!invoice) {
      throw new NotFoundException(`Vendor invoice with ID '${id}' not found`);
    }

    if (user.role === Role.VENDOR && user.vendorId && invoice.vendorId !== user.vendorId) {
      throw new ForbiddenException('Vendors can only view their own invoices');
    }

    return invoice;
  }

  async approveInvoice(
    user: AuthUser,
    id: string,
    dto: ApproveVendorInvoiceDto,
  ): Promise<VendorInvoice> {
    const invoice = await this.findInvoiceById(user, id);

    if (invoice.paymentStatus === VendorInvoiceStatus.PAID) {
      throw new BadRequestException('Invoice is already paid');
    }

    invoice.paymentStatus = VendorInvoiceStatus.APPROVED;
    invoice.approvedByUserId = user.sub;
    if (dto.notes) {
      invoice.notes = invoice.notes ? `${invoice.notes} | ${dto.notes}` : dto.notes;
    }

    return this.invoicesRepo.save(invoice);
  }

  async recordPayment(
    user: AuthUser,
    id: string,
    dto: RecordVendorPaymentDto,
  ): Promise<VendorInvoice> {
    const invoice = await this.findInvoiceById(user, id);

    const paymentAmount = Math.round(Number(dto.paidAmount) * 100) / 100;
    const currentPaid = Math.round(Number(invoice.paidAmount ?? 0) * 100) / 100;
    const newPaidTotal = Math.round((currentPaid + paymentAmount) * 100) / 100;

    invoice.paidAmount = newPaidTotal;
    invoice.paymentReference = dto.paymentReference;
    invoice.paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();

    if (newPaidTotal >= invoice.totalAmount) {
      invoice.paymentStatus = VendorInvoiceStatus.PAID;
    } else {
      invoice.paymentStatus = VendorInvoiceStatus.PARTIALLY_PAID;
    }

    if (dto.notes) {
      invoice.notes = invoice.notes ? `${invoice.notes} | ${dto.notes}` : dto.notes;
    }

    return this.invoicesRepo.save(invoice);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ REVIEWS & PERFORMANCE RATINGS
  // ═══════════════════════════════════════════════════════════════════════════

  async createReview(
    user: AuthUser,
    vendorId: string,
    dto: CreateVendorReviewDto,
  ): Promise<VendorReview> {
    const societyId = this.getSocietyId(user);
    const vendor = await this.findVendorById(user, vendorId);

    const review = this.reviewsRepo.create({
      ...dto,
      societyId,
      vendorId: vendor.id,
      reviewedByUserId: user.sub,
    });
    const savedReview = await this.reviewsRepo.save(review);

    // Compute updated average rating
    const currentCount = vendor.ratingCount ?? 0;
    const currentRating = Number(vendor.rating ?? 0);
    const newCount = currentCount + 1;
    const newAverage = Math.round(((currentRating * currentCount + dto.rating) / newCount) * 100) / 100;

    vendor.rating = newAverage;
    vendor.ratingCount = newCount;
    await this.vendorsRepo.save(vendor);

    return savedReview;
  }

  async findReviews(user: AuthUser, vendorId: string): Promise<VendorReview[]> {
    const societyId = this.getSocietyId(user);
    return this.reviewsRepo.find({
      where: { societyId, vendorId },
      order: { createdAt: 'DESC' },
      relations: ['reviewedByUser'],
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ⏰ AUTOMATED EXPIRY & AMC ALERTS
  // ═══════════════════════════════════════════════════════════════════════════

  async checkContractExpiries(): Promise<{ checked: number; alerted: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeContracts = await this.contractsRepo.find({
      where: { status: ContractStatus.ACTIVE },
      relations: ['vendor'],
    });

    let alerted = 0;

    for (const contract of activeContracts) {
      const endDate = new Date(contract.endDate);
      endDate.setHours(0, 0, 0, 0);

      const diffTime = endDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Check if days remaining matches any configured reminder threshold (e.g. 30, 15, 7)
      const thresholds = contract.renewalReminderDays ?? [30, 15, 7];

      if (daysRemaining > 0 && thresholds.includes(daysRemaining)) {
        this.logger.warn(
          `Contract Expiry Alert: Contract '${contract.title}' (${contract.contractNumber}) with Vendor '${contract.vendor?.name}' expires in ${daysRemaining} days.`,
        );

        // Notify society admins / facility managers
        await this.notificationsService.send({
          userId: 'broadcast-admin',
          societyId: contract.societyId,
          type: NotificationType.GENERAL,
          channel: NotificationChannel.IN_APP,
          subject: `Contract Expiry Warning: ${contract.title}`,
          body: `Contract '${contract.contractNumber}' with '${contract.vendor?.name}' will expire in ${daysRemaining} days on ${contract.endDate}.`,
        });

        contract.lastExpiryAlertSentAt = new Date();
        await this.contractsRepo.save(contract);
        alerted++;
      } else if (daysRemaining <= 0 && contract.status === ContractStatus.ACTIVE) {
        contract.status = ContractStatus.EXPIRED;
        await this.contractsRepo.save(contract);
      }
    }

    return { checked: activeContracts.length, alerted };
  }
}
