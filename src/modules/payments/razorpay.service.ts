import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

/**
 * RazorpayService — mock mode implementation.
 *
 * In MOCK mode (RAZORPAY_MOCK=true or no keys set), all methods return
 * deterministic fake data so development works without real credentials.
 *
 * To switch to live: set RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET in env
 * and set RAZORPAY_MOCK=false.
 */
@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);
  private readonly isMock: boolean;

  constructor(private readonly configService: ConfigService) {
    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID', '');
    this.isMock = !keyId || this.configService.get<string>('RAZORPAY_MOCK', 'true') === 'true';
    if (this.isMock) {
      this.logger.warn('RazorpayService running in MOCK mode — no real payments will be processed');
    }
  }

  /**
   * Create a Razorpay order for a given invoice.
   * Mock: returns a fake order with a predictable ID.
   */
  async createOrder(invoiceId: string, amountInPaise: number): Promise<RazorpayOrder> {
    if (this.isMock) {
      return {
        id: `mock_order_${invoiceId.substring(0, 8)}`,
        amount: amountInPaise,
        currency: 'INR',
        receipt: invoiceId,
        status: 'created',
      };
    }

    // Live implementation (uncomment when keys are ready):
    // const Razorpay = require('razorpay');
    // const instance = new Razorpay({
    //   key_id: this.configService.getOrThrow('RAZORPAY_KEY_ID'),
    //   key_secret: this.configService.getOrThrow('RAZORPAY_KEY_SECRET'),
    // });
    // return instance.orders.create({ amount: amountInPaise, currency: 'INR', receipt: invoiceId });

    throw new Error('Live Razorpay not configured');
  }

  /**
   * Verify Razorpay payment signature.
   * Mock: always returns true.
   */
  verifySignature(orderId: string, paymentId: string, signature: string): boolean {
    if (this.isMock) return true;

    const secret = this.configService.get<string>('RAZORPAY_KEY_SECRET', '');
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    return expectedSignature === signature;
  }
}
