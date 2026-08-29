import {
  Injectable, NotFoundException, ConflictException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, IsNull } from 'typeorm';
import { MaintenanceHead } from './entities/maintenance-head.entity';
import { BillingRule } from './entities/billing-rule.entity';
import { LateFeeConfig } from './entities/late-fee-config.entity';
import { Invoice, InvoiceLineItem } from './entities/invoice.entity';
import {
  CreateMaintenanceHeadDto, UpdateMaintenanceHeadDto,
  CreateBillingRuleDto, UpdateBillingRuleDto,
  UpsertLateFeeConfigDto, GenerateInvoicesDto, WaiveInvoiceDto,
} from './dto/maintenance.dto';
import { StructureService } from '../structure/structure.service';
import { SocietiesService } from '../societies/societies.service';
import { BillingRuleType, InvoiceStatus } from '../../common/enums/billing.enum';

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(
    @InjectRepository(MaintenanceHead) private readonly headsRepo: Repository<MaintenanceHead>,
    @InjectRepository(BillingRule) private readonly rulesRepo: Repository<BillingRule>,
    @InjectRepository(LateFeeConfig) private readonly lateFeeRepo: Repository<LateFeeConfig>,
    @InjectRepository(Invoice) private readonly invoicesRepo: Repository<Invoice>,
    private readonly structureService: StructureService,
    private readonly societiesService: SocietiesService,
  ) {}

  // ─── Maintenance Heads ────────────────────────────────────────────────────

  async createHead(societyId: string, dto: CreateMaintenanceHeadDto): Promise<MaintenanceHead> {
    const existing = await this.headsRepo.findOne({ where: { societyId, name: dto.name } });
    if (existing) throw new ConflictException(`Head "${dto.name}" already exists`);
    const head = this.headsRepo.create({ ...dto, societyId });
    return this.headsRepo.save(head);
  }

  async findAllHeads(societyId: string): Promise<MaintenanceHead[]> {
    return this.headsRepo.find({ where: { societyId }, order: { name: 'ASC' } });
  }

  async updateHead(societyId: string, headId: string, dto: UpdateMaintenanceHeadDto): Promise<MaintenanceHead> {
    const head = await this.headsRepo.findOne({ where: { id: headId, societyId } });
    if (!head) throw new NotFoundException(`Maintenance head ${headId} not found`);
    Object.assign(head, dto);
    return this.headsRepo.save(head);
  }

  async removeHead(societyId: string, headId: string): Promise<void> {
    const head = await this.headsRepo.findOne({ where: { id: headId, societyId } });
    if (!head) throw new NotFoundException(`Maintenance head ${headId} not found`);
    await this.headsRepo.softRemove(head);
  }

  // ─── Billing Rules ────────────────────────────────────────────────────────

  async createRule(societyId: string, dto: CreateBillingRuleDto): Promise<BillingRule> {
    const head = await this.headsRepo.findOne({ where: { id: dto.headId, societyId } });
    if (!head) throw new NotFoundException(`Head ${dto.headId} not found`);
    const rule = this.rulesRepo.create({
      ...dto,
      societyId,
      effectiveFrom: new Date(dto.effectiveFrom),
      effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
    });
    return this.rulesRepo.save(rule);
  }

  async findAllRules(societyId: string): Promise<BillingRule[]> {
    return this.rulesRepo.find({ where: { societyId }, order: { createdAt: 'DESC' } });
  }

  async updateRule(societyId: string, ruleId: string, dto: UpdateBillingRuleDto): Promise<BillingRule> {
    const rule = await this.rulesRepo.findOne({ where: { id: ruleId, societyId } });
    if (!rule) throw new NotFoundException(`Billing rule ${ruleId} not found`);
    Object.assign(rule, {
      ...dto,
      effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : rule.effectiveTo,
    });
    return this.rulesRepo.save(rule);
  }

  async removeRule(societyId: string, ruleId: string): Promise<void> {
    const rule = await this.rulesRepo.findOne({ where: { id: ruleId, societyId } });
    if (!rule) throw new NotFoundException(`Billing rule ${ruleId} not found`);
    await this.rulesRepo.softRemove(rule);
  }

  // ─── Late Fee Config ──────────────────────────────────────────────────────

  async upsertLateFeeConfig(societyId: string, dto: UpsertLateFeeConfigDto): Promise<LateFeeConfig> {
    const existing = await this.lateFeeRepo.findOne({ where: { societyId } });
    if (existing) {
      Object.assign(existing, dto);
      return this.lateFeeRepo.save(existing);
    }
    const config = this.lateFeeRepo.create({ ...dto, societyId });
    return this.lateFeeRepo.save(config);
  }

  async getLateFeeConfig(societyId: string): Promise<LateFeeConfig | null> {
    return this.lateFeeRepo.findOne({ where: { societyId } });
  }

  // ─── Invoice Generation ───────────────────────────────────────────────────

  async generateInvoices(
    societyId: string,
    dto: GenerateInvoicesDto,
  ): Promise<{ generated: number; skipped: number; invoices: Invoice[] }> {
    this.logger.log(`Generating invoices for society ${societyId}, ${dto.month}/${dto.year}`);

    const society = await this.societiesService.findOneInternal(societyId);

    // Get active billing rules for this date
    const asOf = new Date(dto.year, dto.month - 1, 1);
    const rules = await this.rulesRepo.find({
      where: {
        societyId,
        isActive: true,
        effectiveFrom: LessThanOrEqual(asOf),
      },
    });

    if (rules.length === 0) {
      return { generated: 0, skipped: 0, invoices: [] };
    }

    // Get active heads for enrichment
    const heads = await this.headsRepo.find({ where: { societyId, isActive: true } });
    const headMap = new Map(heads.map(h => [h.id, h]));

    // Get units (optionally filter by specific unitId)
    const units = dto.unitId
      ? [await this.structureService.findUnitById(dto.unitId)]
      : await this.structureService.findAllUnits(societyId, { status: 'occupied' });

    // Settings: billing day of month (default 1)
    const billingDay = (society.settings?.billingDay as number) ?? 1;
    const dueDate = new Date(dto.year, dto.month - 1, billingDay + 7); // due 7 days after billing day

    // Get last invoice number sequence for this society/year
    const lastInvoice = await this.invoicesRepo.findOne({
      where: { societyId, billingYear: dto.year },
      order: { invoiceNumber: 'DESC' },
    });
    let seq = lastInvoice
      ? parseInt(lastInvoice.invoiceNumber.split('-').pop() ?? '0', 10) + 1
      : 1;

    const generated: Invoice[] = [];
    let skipped = 0;

    for (const unit of units) {
      // Skip if already invoiced for this month/year
      const exists = await this.invoicesRepo.findOne({
        where: { societyId, unitId: unit.id, billingMonth: dto.month, billingYear: dto.year },
      });
      if (exists) { skipped++; continue; }

      // Calculate line items
      const lineItems: InvoiceLineItem[] = [];
      let subtotal = 0;

      for (const rule of rules) {
        // Skip rules that don't apply to this unit type
        if (rule.unitType && rule.unitType !== unit.type) continue;
        // Skip expired rules
        if (rule.effectiveTo && new Date(rule.effectiveTo) < asOf) continue;

        const head = headMap.get(rule.headId);
        if (!head) continue;

        let amount = 0;
        if (rule.ruleType === BillingRuleType.PER_UNIT || rule.ruleType === BillingRuleType.FIXED) {
          amount = Number(rule.amount);
        } else if (rule.ruleType === BillingRuleType.PER_SQFT) {
          amount = Number(rule.amount) * (unit.sqFt ?? 0);
        }

        lineItems.push({ headId: rule.headId, headName: head.name, amount });
        subtotal += amount;
      }

      if (lineItems.length === 0) { skipped++; continue; }

      const invoiceNumber = `INV-${dto.year}-${String(seq++).padStart(4, '0')}`;
      const invoice = this.invoicesRepo.create({
        societyId,
        unitId: unit.id,
        residentId: null,
        invoiceNumber,
        billingMonth: dto.month,
        billingYear: dto.year,
        dueDate,
        subtotal,
        lateFee: 0,
        discount: 0,
        totalAmount: subtotal,
        status: InvoiceStatus.PENDING,
        lineItems,
      });

      generated.push(await this.invoicesRepo.save(invoice));
    }

    this.logger.log(`Generated ${generated.length} invoices, skipped ${skipped}`);
    return { generated: generated.length, skipped, invoices: generated };
  }

  // ─── Invoice Queries ──────────────────────────────────────────────────────

  async findAllInvoices(
    societyId: string,
    filters?: { status?: string; month?: number; year?: number; unitId?: string },
  ): Promise<Invoice[]> {
    const where: Record<string, unknown> = { societyId };
    if (filters?.status) where.status = filters.status;
    if (filters?.month) where.billingMonth = filters.month;
    if (filters?.year) where.billingYear = filters.year;
    if (filters?.unitId) where.unitId = filters.unitId;
    return this.invoicesRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOneInvoice(societyId: string, invoiceId: string): Promise<Invoice> {
    const invoice = await this.invoicesRepo.findOne({ where: { id: invoiceId, societyId } });
    if (!invoice) throw new NotFoundException(`Invoice ${invoiceId} not found`);
    return invoice;
  }

  async waiveInvoice(societyId: string, invoiceId: string, dto: WaiveInvoiceDto): Promise<Invoice> {
    const invoice = await this.findOneInvoice(societyId, invoiceId);
    invoice.discount = dto.discount;
    invoice.totalAmount = Math.max(0, Number(invoice.subtotal) + Number(invoice.lateFee) - dto.discount);
    if (dto.notes) invoice.notes = dto.notes;
    if (invoice.totalAmount === 0) invoice.status = InvoiceStatus.WAIVED;
    return this.invoicesRepo.save(invoice);
  }

  /** Called by the daily BullMQ job to apply late fees */
  async applyLateFees(societyId: string): Promise<number> {
    const config = await this.lateFeeRepo.findOne({ where: { societyId, isActive: true } });
    if (!config) return 0;

    const graceDate = new Date();
    graceDate.setDate(graceDate.getDate() - config.gracePeriodDays);

    const overdueInvoices = await this.invoicesRepo.find({
      where: {
        societyId,
        status: InvoiceStatus.PENDING,
        dueDate: LessThanOrEqual(graceDate),
      },
    });

    let updated = 0;
    for (const invoice of overdueInvoices) {
      if (Number(invoice.lateFee) === 0) {
        const fee = config.feeType === 'flat'
          ? Number(config.value)
          : (Number(invoice.subtotal) * Number(config.value)) / 100;

        invoice.lateFee = fee;
        invoice.totalAmount = Number(invoice.subtotal) + fee - Number(invoice.discount);
        invoice.status = InvoiceStatus.OVERDUE;
        await this.invoicesRepo.save(invoice);
        updated++;
      }
    }
    return updated;
  }

  /** Mark invoice as paid — called by PaymentsService */
  async markInvoicePaid(invoiceId: string, paidAt: Date): Promise<void> {
    await this.invoicesRepo.update(invoiceId, { status: InvoiceStatus.PAID, paidAt });
  }
}
