import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsInt,
  Min,
  Max,
  MaxLength,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeliveryType, DeliveryStatus } from '../../../common/enums/delivery.enum';

export class CreateDeliveryDto {
  @ApiProperty({ description: 'Target Unit UUID' })
  @IsUUID()
  @IsNotEmpty()
  unitId: string;

  @ApiProperty({ description: 'Physical Gate UUID where package arrived' })
  @IsUUID()
  @IsNotEmpty()
  gateId: string;

  @ApiProperty({ enum: DeliveryType, example: DeliveryType.ECOMMERCE })
  @IsEnum(DeliveryType)
  deliveryType: DeliveryType;

  @ApiProperty({ example: 'Amazon', description: 'Courier / Vendor / Company name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  company: string;

  @ApiPropertyOptional({ example: 'Rahul Kumar' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  deliveryPersonName?: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  deliveryPersonPhone?: string;

  @ApiPropertyOptional({ example: 'DL 01 AB 1234' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  vehicleNumber?: string;

  @ApiPropertyOptional({ example: 'TBA123456789' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  trackingNumber?: string;

  @ApiPropertyOptional({ example: 'Medium cardboard box with electronics' })
  @IsOptional()
  @IsString()
  itemDescription?: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/parcels/123.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  photoUrl?: string;

  @ApiPropertyOptional({ description: 'Specific resident user ID if known' })
  @IsOptional()
  @IsUUID()
  recipientUserId?: string;

  @ApiPropertyOptional({ description: 'True if left at gate security desk, false if direct entry', default: true })
  @IsOptional()
  @IsBoolean()
  leaveAtGate?: boolean;

  @ApiPropertyOptional({ example: 'Fragile package' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class PreApproveDeliveryDto {
  @ApiPropertyOptional({ description: 'Target Unit UUID (required for admins, auto-filled for residents)' })
  @IsOptional()
  @IsUUID()
  unitId?: string;

  @ApiProperty({ enum: DeliveryType, example: DeliveryType.FOOD })
  @IsEnum(DeliveryType)
  deliveryType: DeliveryType;

  @ApiProperty({ example: 'Zomato', description: 'Company name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  company: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  deliveryPersonPhone?: string;

  @ApiPropertyOptional({ example: 'MH 02 CZ 9988' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  vehicleNumber?: string;

  @ApiPropertyOptional({ description: 'True if guard should receive parcel, false for direct door delivery', default: true })
  @IsOptional()
  @IsBoolean()
  leaveAtGate?: boolean;

  @ApiPropertyOptional({ example: 'Please leave with guard at Gate 2' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CollectDeliveryDto {
  @ApiPropertyOptional({ example: '492815', description: '6-digit OTP given by resident at pickup' })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  pickupOtp?: string;

  @ApiPropertyOptional({ description: 'Resident User ID who picked up the package' })
  @IsOptional()
  @IsUUID()
  collectedByUserId?: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/handover/photo1.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  handoverPhotoUrl?: string;

  @ApiPropertyOptional({ example: 'Picked up by resident in person' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class VerifyDeliveryOtpDto {
  @ApiProperty({ example: '492815', description: '6-digit OTP' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  otp: string;
}

export class AllowDirectEntryDto {
  @ApiPropertyOptional({ example: 'Allowed direct entry to Tower B Flat 402' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReturnDeliveryDto {
  @ApiProperty({ example: 'Resident rejected parcel / Incorrect address' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class UpdateDeliveryDto {
  @ApiPropertyOptional({ example: 'Parcel shifted to storage rack B3' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/parcels/123.jpg' })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({ example: 'TBA987654321' })
  @IsOptional()
  @IsString()
  trackingNumber?: string;
}

export class DeliveryQueryDto {
  @ApiPropertyOptional({ enum: DeliveryStatus })
  @IsOptional()
  @IsEnum(DeliveryStatus)
  status?: DeliveryStatus;

  @ApiPropertyOptional({ enum: DeliveryType })
  @IsOptional()
  @IsEnum(DeliveryType)
  deliveryType?: DeliveryType;

  @ApiPropertyOptional({ description: 'Filter by Unit UUID' })
  @IsOptional()
  @IsUUID()
  unitId?: string;

  @ApiPropertyOptional({ description: 'Filter by Gate UUID' })
  @IsOptional()
  @IsUUID()
  gateId?: string;

  @ApiPropertyOptional({ description: 'Search company, delivery person, or tracking number' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter pending pickup only', example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPending?: boolean;

  @ApiPropertyOptional({ description: 'Filter unattended (>24h at gate) parcels', example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isUnattended?: boolean;

  @ApiPropertyOptional({ example: '2026-08-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-08-31T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
