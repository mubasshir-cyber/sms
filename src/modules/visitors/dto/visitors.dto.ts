import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsDateString,
  IsPhoneNumber,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VisitorType, VisitorStatus } from '../../../common/enums/visitor.enum';

export class InviteVisitorDto {
  @ApiProperty({ description: 'Unit ID for the visitor', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @IsUUID()
  @IsNotEmpty()
  unitId: string;

  @ApiProperty({ description: 'Name of the visitor', example: 'Rahul Sharma' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Phone number of the visitor', example: '+919876543210' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ enum: VisitorType, default: VisitorType.GUEST })
  @IsEnum(VisitorType)
  @IsOptional()
  visitorType?: VisitorType;

  @ApiPropertyOptional({ description: 'Purpose of visit', example: 'Dinner party' })
  @IsString()
  @IsOptional()
  purpose?: string;

  @ApiPropertyOptional({ description: 'Vehicle number if coming by personal vehicle', example: 'MH12AB1234' })
  @IsString()
  @IsOptional()
  vehicleNumber?: string;

  @ApiProperty({ description: 'Valid from timestamp', example: '2026-09-05T18:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  validFrom: string;

  @ApiProperty({ description: 'Valid until timestamp', example: '2026-09-05T23:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  validUntil: string;

  @ApiPropertyOptional({ description: 'Mark as frequent visitor', default: false })
  @IsBoolean()
  @IsOptional()
  isFrequent?: boolean;
}

export class WalkInVisitorDto {
  @ApiProperty({ description: 'Destination Unit ID', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @IsUUID()
  @IsNotEmpty()
  unitId: string;

  @ApiProperty({ description: 'Name of visitor', example: 'Swiggy Delivery Partner' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Phone number', example: '+919876543210' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ enum: VisitorType, default: VisitorType.DELIVERY })
  @IsEnum(VisitorType)
  @IsNotEmpty()
  visitorType: VisitorType;

  @ApiProperty({ description: 'Gate ID through which visitor is entering', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @IsUUID()
  @IsNotEmpty()
  gateId: string;

  @ApiPropertyOptional({ description: 'Purpose or company name', example: 'Food Delivery' })
  @IsString()
  @IsOptional()
  purpose?: string;

  @ApiPropertyOptional({ description: 'Vehicle number' })
  @IsString()
  @IsOptional()
  vehicleNumber?: string;

  @ApiPropertyOptional({ description: 'Photo taken at gate' })
  @IsString()
  @IsOptional()
  photoUrl?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CheckInVisitorDto {
  @ApiProperty({ description: 'Gate ID through which visitor is entering', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @IsUUID()
  @IsNotEmpty()
  gateId: string;

  @ApiPropertyOptional({ description: 'Vehicle number' })
  @IsString()
  @IsOptional()
  vehicleNumber?: string;

  @ApiPropertyOptional({ description: 'Photo taken at gate' })
  @IsString()
  @IsOptional()
  photoUrl?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CheckOutVisitorDto {
  @ApiProperty({ description: 'Gate ID through which visitor is exiting', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @IsUUID()
  @IsNotEmpty()
  gateId: string;

  @ApiPropertyOptional({ description: 'Exit notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class BlacklistVisitorDto {
  @ApiProperty({ description: 'Reason for blacklisting', example: 'Misbehavior with security guards' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class VisitorQueryDto {
  @ApiPropertyOptional({ enum: VisitorStatus })
  @IsEnum(VisitorStatus)
  @IsOptional()
  status?: VisitorStatus;

  @ApiPropertyOptional({ enum: VisitorType })
  @IsEnum(VisitorType)
  @IsOptional()
  type?: VisitorType;

  @ApiPropertyOptional({ description: 'Unit ID' })
  @IsUUID()
  @IsOptional()
  unitId?: string;

  @ApiPropertyOptional({ description: 'Filter from date' })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Filter to date' })
  @IsDateString()
  @IsOptional()
  toDate?: string;
}
