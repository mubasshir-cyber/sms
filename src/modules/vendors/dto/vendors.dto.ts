import {
  IsString,
  IsEnum,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsDateString,
  IsUUID,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  VendorCategory,
  VendorStatus,
  ContractStatus,
  ContractBillingFrequency,
  AmcScheduleStatus,
  VendorInvoiceStatus,
} from '../../../common/enums/vendor.enum';

// ─── Vendor Profile DTOs ──────────────────────────────────────────────────────

export class VendorBankDetailsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ifscCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  upiId?: string;
}

export class CreateVendorDto {
  @ApiProperty({ example: 'LiftCo India Pvt. Ltd.' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: VendorCategory, example: VendorCategory.LIFT_AMC })
  @IsEnum(VendorCategory)
  category: VendorCategory;

  @ApiProperty({ example: 'Rajesh Sharma' })
  @IsString()
  @IsNotEmpty()
  contactPerson: string;

  @ApiProperty({ example: 'service@liftco.in' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ example: '+919876543211' })
  @IsOptional()
  @IsString()
  alternatePhone?: string;

  @ApiPropertyOptional({ example: '123 Industrial Area, Bengaluru, KA 560058' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '29ABCDE1234F1Z5' })
  @IsOptional()
  @IsString()
  gstin?: string;

  @ApiPropertyOptional({ example: 'ABCDE1234F' })
  @IsOptional()
  @IsString()
  pan?: string;

  @ApiPropertyOptional({ type: VendorBankDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VendorBankDetailsDto)
  bankDetails?: VendorBankDetailsDto;

  @ApiPropertyOptional({ example: 'Authorized Schindler lift partner' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Optional User account ID for vendor portal login' })
  @IsOptional()
  @IsUUID()
  userId?: string;
}

export class UpdateVendorDto extends PartialType(CreateVendorDto) {
  @ApiPropertyOptional({ enum: VendorStatus })
  @IsOptional()
  @IsEnum(VendorStatus)
  status?: VendorStatus;
}

export class VendorQueryDto {
  @ApiPropertyOptional({ enum: VendorCategory })
  @IsOptional()
  @IsEnum(VendorCategory)
  category?: VendorCategory;

  @ApiPropertyOptional({ enum: VendorStatus })
  @IsOptional()
  @IsEnum(VendorStatus)
  status?: VendorStatus;

  @ApiPropertyOptional({ description: 'Search term for name, contact person, or email' })
  @IsOptional()
  @IsString()
  search?: string;
}

// ─── Vendor Contract DTOs ────────────────────────────────────────────────────

export class CreateVendorContractDto {
  @ApiProperty({ example: 'Annual Passenger Lift Maintenance 2026-27' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ enum: VendorCategory, example: VendorCategory.LIFT_AMC })
  @IsEnum(VendorCategory)
  serviceCategory: VendorCategory;

  @ApiProperty({ example: '2026-04-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2027-03-31' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: 300000.0 })
  @IsNumber()
  @Min(0)
  contractValue: number;

  @ApiPropertyOptional({ enum: ContractBillingFrequency, default: ContractBillingFrequency.MONTHLY })
  @IsOptional()
  @IsEnum(ContractBillingFrequency)
  billingFrequency?: ContractBillingFrequency;

  @ApiPropertyOptional({ example: 30, default: 30 })
  @IsOptional()
  @IsNumber()
  paymentTermsDays?: number;

  @ApiPropertyOptional({ example: 'Monthly maintenance on second Saturday of each month.' })
  @IsOptional()
  @IsString()
  termsAndConditions?: string;

  @ApiPropertyOptional({ example: 'Breakdown response time under 2 hours; 24x7 emergency entrapment.' })
  @IsOptional()
  @IsString()
  slaDetails?: string;

  @ApiPropertyOptional({ type: [String], example: ['https://s3.amazonaws.com/sms/contracts/liftco.pdf'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentUrls?: string[];

  @ApiPropertyOptional({ type: [Number], example: [30, 15, 7] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  renewalReminderDays?: number[];
}

export class UpdateVendorContractDto extends PartialType(CreateVendorContractDto) {
  @ApiPropertyOptional({ enum: ContractStatus })
  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;
}

export class ContractQueryDto {
  @ApiPropertyOptional({ enum: ContractStatus })
  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;

  @ApiPropertyOptional({ enum: VendorCategory })
  @IsOptional()
  @IsEnum(VendorCategory)
  serviceCategory?: VendorCategory;
}

// ─── AMC Schedule DTOs ───────────────────────────────────────────────────────

export class CreateAmcScheduleDto {
  @ApiProperty({ example: '2026-05-10' })
  @IsDateString()
  scheduledDate: string;

  @ApiProperty({ example: 'Quarterly Comprehensive Motor & Cable Servicing' })
  @IsString()
  @IsNotEmpty()
  serviceType: string;

  @ApiPropertyOptional({ example: 'Sunil Verma' })
  @IsOptional()
  @IsString()
  technicianName?: string;

  @ApiPropertyOptional({ example: '+919876501234' })
  @IsOptional()
  @IsString()
  technicianPhone?: string;

  @ApiPropertyOptional({ example: 'Verify rope tension and emergency braking calibration.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAmcScheduleDto extends PartialType(CreateAmcScheduleDto) {
  @ApiPropertyOptional({ enum: AmcScheduleStatus })
  @IsOptional()
  @IsEnum(AmcScheduleStatus)
  status?: AmcScheduleStatus;
}

export class CompleteAmcVisitDto {
  @ApiPropertyOptional({ example: 'https://s3.amazonaws.com/sms/reports/lift-service-may.pdf' })
  @IsOptional()
  @IsString()
  serviceReportUrl?: string;

  @ApiPropertyOptional({ example: 'Sunil Verma' })
  @IsOptional()
  @IsString()
  technicianName?: string;

  @ApiPropertyOptional({ example: '+919876501234' })
  @IsOptional()
  @IsString()
  technicianPhone?: string;

  @ApiPropertyOptional({ example: 'Inspection successful. Replaced oil filter.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

// ─── Vendor Invoice DTOs ─────────────────────────────────────────────────────

export class CreateVendorInvoiceDto {
  @ApiPropertyOptional({ description: 'Associated contract ID if invoice is against an ongoing contract' })
  @IsOptional()
  @IsUUID()
  contractId?: string;

  @ApiProperty({ example: 'INV-2026-089' })
  @IsString()
  @IsNotEmpty()
  invoiceNumber: string;

  @ApiProperty({ example: '2026-05-01' })
  @IsDateString()
  invoiceDate: string;

  @ApiProperty({ example: '2026-05-31' })
  @IsDateString()
  dueDate: string;

  @ApiProperty({ example: 25000.0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: 4500.0, default: 0.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @ApiPropertyOptional({ example: 'https://s3.amazonaws.com/sms/invoices/liftco-may.pdf' })
  @IsOptional()
  @IsString()
  invoicePdfUrl?: string;

  @ApiPropertyOptional({ example: 'Monthly maintenance invoice for May 2026' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateVendorInvoiceDto extends PartialType(CreateVendorInvoiceDto) {}

export class ApproveVendorInvoiceDto {
  @ApiPropertyOptional({ example: 'Verified service report. Approved for payment.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RecordVendorPaymentDto {
  @ApiProperty({ example: 29500.0 })
  @IsNumber()
  @Min(0.01)
  paidAmount: number;

  @ApiProperty({ example: 'NEFT-AXIS-20260515001' })
  @IsString()
  @IsNotEmpty()
  paymentReference: string;

  @ApiPropertyOptional({ example: '2026-05-15T10:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @ApiPropertyOptional({ example: 'Full payment cleared via online transfer' })
  @IsOptional()
  @IsString()
  notes?: string;
}

// ─── Vendor Review DTOs ──────────────────────────────────────────────────────

export class CreateVendorReviewDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  contractId?: string;

  @ApiProperty({ example: 5, description: 'Rating from 1 to 5' })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: 'Prompt response and excellent routine maintenance.' })
  @IsOptional()
  @IsString()
  review?: string;
}
