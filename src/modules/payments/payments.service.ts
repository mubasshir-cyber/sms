import {
  Injectable, NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { CreateOrderDto, ManualPaymentDto } from './dto/payment.dto';
import { RazorpayService } from './razorpay.service';
import { MaintenanceService } from '../maintenance/maintenance.service';
import { PdfService } from '../../common/services/pdf.service';
import { SocietiesService } from '../societies/societies.service';
import { PaymentMethod, PaymentStatus } from '../../common/enums/payment.enum';
import { InvoiceStatus } from '../../common/enums/billing.enum';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment) private readonly paymentsRepo: Repository<Payment>,
    private readonly razorpayService: RazorpayService,
    private readonly maintenanceService: MaintenanceService,
    private readonly pdfService: PdfService,
    private readonly societiesService: SocietiesService,
  ) {}

  // ─── Online Payment (Razorpay) ────────────────────────────────────────────

  async createOrder(societyId: string, dto: CreateOrderDto): Promise<object> {
    const invoice = await this.maintenanceService.findOneInvoice(societyId, dto.invoiceId);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Invoice is already paid');
    }
    if (invoice.status === InvoiceStatus.WAIVED) {
      throw new BadRequestException('Invoice has been waived');
    }

    const amountInPaise = Math.round(Number(invoice.totalAmount) * 100);
    const order = await this.razorpayService.createOrder(invoice.id, amountInPaise);

    // Create a pending payment record
    const payment = this.paymentsRepo.create({
      societyId,
      invoiceId: invoice.id,
      unitId: invoice.unitId,
      amount: invoice.totalAmount,
      method: PaymentMethod.UPI, // will be updated on webhook
      status: PaymentStatus.PENDING,
      gatewayOrderId: order.id,
    });
    await this.paymentsRepo.save(payment);

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
    };
  }

  async handleWebhook(
    societyId: string,
    orderId: string,
    paymentId: string,
    signature: string,
  ): Promise<Payment> {
    const isValid = this.razorpayService.verifySignature(orderId, paymentId, signature);
    if (!isValid) throw new BadRequestException('Invalid payment signature');

    const payment = await this.paymentsRepo.findOne({
      where: { gatewayOrderId: orderId, societyId },
    });
    if (!payment) throw new NotFoundException('Payment record not found for this order');

    payment.gatewayPaymentId = paymentId;
    payment.gatewaySignature = signature;
    payment.status = PaymentStatus.SUCCESS;
    payment.paidAt = new Date();
    payment.receiptNumber = await this.generateReceiptNumber(societyId);

    const saved = await this.paymentsRepo.save(payment);
    await this.maintenanceService.markInvoicePaid(payment.invoiceId, payment.paidAt!);

    this.logger.log(`Payment confirmed: ${saved.id} for invoice ${payment.invoiceId}`);
    return saved;
  }

  // ─── Manual Payment (Cash / Cheque) ───────────────────────────────────────

  async recordManual(societyId: string, dto: ManualPaymentDto, recordedByUserId: string): Promise<Payment> {
    const invoice = await this.maintenanceService.findOneInvoice(societyId, dto.invoiceId);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Invoice is already paid');
    }

    const paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();
    const receiptNumber = await this.generateReceiptNumber(societyId);

    const payment = this.paymentsRepo.create({
      societyId,
      invoiceId: invoice.id,
      unitId: invoice.unitId,
      amount: dto.amount,
      method: dto.method,
      status: PaymentStatus.SUCCESS,
      paidAt,
      chequeNo: dto.chequeNo ?? null,
      bankName: dto.bankName ?? null,
      notes: dto.notes ?? null,
      receiptNumber,
      recordedByUserId,
    });

    const saved = await this.paymentsRepo.save(payment);
    await this.maintenanceService.markInvoicePaid(invoice.id, paidAt);

    this.logger.log(`Manual payment recorded: ${saved.id} for invoice ${invoice.id}`);
    return saved;
  }

  // ─── Queries ──────────────────────────────────────────────────────────────

  async findAll(societyId: string, filters?: { invoiceId?: string; unitId?: string; status?: string }): Promise<Payment[]> {
    const where: Record<string, unknown> = { societyId };
    if (filters?.invoiceId) where.invoiceId = filters.invoiceId;
    if (filters?.unitId) where.unitId = filters.unitId;
    if (filters?.status) where.status = filters.status;
    return this.paymentsRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(societyId: string, paymentId: string): Promise<Payment> {
    const payment = await this.paymentsRepo.findOne({ where: { id: paymentId, societyId } });
    if (!payment) throw new NotFoundException(`Payment ${paymentId} not found`);
    return payment;
  }

  async getOutstanding(societyId: string): Promise<object[]> {
    return this.maintenanceService.findAllInvoices(societyId, { status: 'pending' });
  }

  // ─── Receipt PDF ──────────────────────────────────────────────────────────

  async getReceiptPdf(societyId: string, paymentId: string): Promise<Buffer> {
    const payment = await this.findOne(societyId, paymentId);
    const invoice = await this.maintenanceService.findOneInvoice(societyId, payment.invoiceId);
    const society = await this.societiesService.findOneInternal(societyId);
    return this.pdfService.generateReceiptPdf(payment, invoice, society.name);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async generateReceiptNumber(societyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.paymentsRepo.count({
      where: { societyId, status: PaymentStatus.SUCCESS },
    });
    return `RCP-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}
