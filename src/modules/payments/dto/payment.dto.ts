import {
  IsUUID, IsEnum, IsOptional, IsNumber, IsString, IsDateString, Min, MaxLength,
} from 'class-validator';
import { PaymentMethod } from '../../../common/enums/payment.enum';

export class CreateOrderDto {
  @IsUUID()
  invoiceId: string;
}

export class ManualPaymentDto {
  @IsUUID()
  invoiceId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  amount: number;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  chequeNo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankName?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class RazorpayWebhookDto {
  @IsString()
  razorpay_order_id: string;

  @IsString()
  razorpay_payment_id: string;

  @IsString()
  razorpay_signature: string;
}
