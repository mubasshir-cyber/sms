import { Injectable, Logger } from '@nestjs/common';
import * as PDFKitDoc from 'pdfkit';
import { Invoice } from '../../modules/maintenance/entities/invoice.entity';
import { Payment } from '../../modules/payments/entities/payment.entity';

// pdfkit export compatibility with TS
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PDFDocument: any = (PDFKitDoc as any).default || PDFKitDoc;

/**
 * PdfService — generates PDF documents for invoices and receipts using PDFKit.
 * Returns a Buffer that can be stored to S3/R2 or sent as a response.
 */
@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  // ─── Invoice PDF ─────────────────────────────────────────────────────────

  async generateInvoicePdf(invoice: Invoice, societyName: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ─── Header ──────────────────────────────────────────────────────────
      doc.fontSize(22).font('Helvetica-Bold').text('MAINTENANCE INVOICE', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text(societyName, { align: 'center' });
      doc.moveDown(1);

      // ─── Invoice Metadata ─────────────────────────────────────────────────
      this.drawLine(doc);
      doc.moveDown(0.5);
      const monthName = new Date(invoice.billingYear, invoice.billingMonth - 1).toLocaleString('en-IN', {
        month: 'long',
      });

      this.labelValue(doc, 'Invoice No:', invoice.invoiceNumber);
      this.labelValue(doc, 'Period:', `${monthName} ${invoice.billingYear}`);
      this.labelValue(doc, 'Unit:', invoice.unitId);
      this.labelValue(doc, 'Due Date:', new Date(invoice.dueDate).toLocaleDateString('en-IN'));
      this.labelValue(doc, 'Status:', invoice.status.toUpperCase());
      doc.moveDown(0.5);

      // ─── Line Items ───────────────────────────────────────────────────────
      this.drawLine(doc);
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica-Bold');
      doc.text('Charge Head', 50, doc.y, { continued: true, width: 300 });
      doc.text('Amount (₹)', { align: 'right' });
      doc.font('Helvetica');
      doc.moveDown(0.3);

      for (const item of invoice.lineItems) {
        doc.text(item.headName, 50, doc.y, { continued: true, width: 300 });
        doc.text(`₹${Number(item.amount).toFixed(2)}`, { align: 'right' });
        doc.moveDown(0.2);
      }

      doc.moveDown(0.5);
      this.drawLine(doc);
      doc.moveDown(0.3);

      // ─── Totals ───────────────────────────────────────────────────────────
      this.labelValue(doc, 'Subtotal:', `₹${Number(invoice.subtotal).toFixed(2)}`);
      if (Number(invoice.discount) > 0) {
        this.labelValue(doc, 'Discount:', `-₹${Number(invoice.discount).toFixed(2)}`);
      }
      if (Number(invoice.lateFee) > 0) {
        this.labelValue(doc, 'Late Fee:', `₹${Number(invoice.lateFee).toFixed(2)}`);
      }
      doc.moveDown(0.3);
      doc.fontSize(13).font('Helvetica-Bold');
      this.labelValue(doc, 'TOTAL DUE:', `₹${Number(invoice.totalAmount).toFixed(2)}`);

      // ─── Footer ───────────────────────────────────────────────────────────
      doc.moveDown(2);
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('grey')
        .text('This is a computer-generated invoice. No signature required.', { align: 'center' });

      doc.end();
    });
  }

  // ─── Receipt PDF ──────────────────────────────────────────────────────────

  async generateReceiptPdf(payment: Payment, invoice: Invoice, societyName: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(22).font('Helvetica-Bold').text('PAYMENT RECEIPT', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text(societyName, { align: 'center' });
      doc.moveDown(1);

      this.drawLine(doc);
      doc.moveDown(0.5);

      this.labelValue(doc, 'Receipt No:', payment.receiptNumber ?? 'N/A');
      this.labelValue(doc, 'Invoice No:', invoice.invoiceNumber);
      this.labelValue(doc, 'Unit:', invoice.unitId);
      this.labelValue(doc, 'Amount Paid:', `₹${Number(payment.amount).toFixed(2)}`);
      this.labelValue(doc, 'Payment Method:', payment.method.toUpperCase());
      this.labelValue(doc, 'Date:', new Date(payment.paidAt ?? new Date()).toLocaleDateString('en-IN'));
      if (payment.gatewayPaymentId) {
        this.labelValue(doc, 'Transaction ID:', payment.gatewayPaymentId);
      }
      if (payment.chequeNo) {
        this.labelValue(doc, 'Cheque No:', payment.chequeNo);
      }

      doc.moveDown(2);
      doc.fontSize(12).font('Helvetica-Bold').fillColor('green').text('✓ PAYMENT RECEIVED', { align: 'center' });

      doc.moveDown(2);
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('grey')
        .text('This is a computer-generated receipt. No signature required.', { align: 'center' });

      doc.end();
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private drawLine(doc: any): void {
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private labelValue(doc: any, label: string, value: string): void {
    doc.fontSize(11).font('Helvetica-Bold').text(label, 50, doc.y, { continued: true, width: 200 });
    doc.font('Helvetica').text(value);
    doc.moveDown(0.2);
  }
}
