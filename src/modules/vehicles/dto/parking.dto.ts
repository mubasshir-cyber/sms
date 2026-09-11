import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  Min,
  Max,
  MaxLength,
  Matches,
  IsPositive,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ParkingSlotType,
  ParkingSlotStatus,
  AllocationType,
  TransferStatus,
} from '../../../common/enums/vehicle-parking.enum';

export class CreateParkingSlotDto {
  @ApiProperty({ example: 'B1-101', description: 'Unique slot identifier' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  slotNumber: string;

  @ApiPropertyOptional({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @IsOptional()
  @IsUUID()
  towerId?: string;

  @ApiPropertyOptional({ example: 'Basement 1' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  floor?: string;

  @ApiPropertyOptional({ enum: ParkingSlotType, default: ParkingSlotType.OPEN })
  @IsOptional()
  @IsEnum(ParkingSlotType)
  slotType: ParkingSlotType = ParkingSlotType.OPEN;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isVisitorSlot: boolean = false;

  @ApiPropertyOptional({ example: 'Near Pillar 14' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkCreateSlotsDto {
  @ApiProperty({ example: 'B1-', description: 'Prefix for generated slot numbers' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  prefix: string;

  @ApiProperty({ example: 1, description: 'Starting slot number' })
  @IsInt()
  @Min(1)
  fromNumber: number;

  @ApiProperty({ example: 50, description: 'Ending slot number (inclusive, max 200 per batch)' })
  @IsInt()
  @Min(1)
  @Max(1000)
  toNumber: number;

  @ApiPropertyOptional({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @IsOptional()
  @IsUUID()
  towerId?: string;

  @ApiPropertyOptional({ example: 'Basement 1' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  floor?: string;

  @ApiPropertyOptional({ enum: ParkingSlotType, default: ParkingSlotType.COVERED })
  @IsOptional()
  @IsEnum(ParkingSlotType)
  slotType: ParkingSlotType = ParkingSlotType.COVERED;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isVisitorSlot: boolean = false;
}

export class UpdateParkingSlotDto {
  @ApiPropertyOptional({ example: 'B1-102' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  slotNumber?: string;

  @ApiPropertyOptional({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @IsOptional()
  @IsUUID()
  towerId?: string;

  @ApiPropertyOptional({ example: 'Basement 1' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  floor?: string;

  @ApiPropertyOptional({ enum: ParkingSlotType })
  @IsOptional()
  @IsEnum(ParkingSlotType)
  slotType?: ParkingSlotType;

  @ApiPropertyOptional({ enum: ParkingSlotStatus })
  @IsOptional()
  @IsEnum(ParkingSlotStatus)
  status?: ParkingSlotStatus;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isVisitorSlot?: boolean;

  @ApiPropertyOptional({ example: 'Updated notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AllocateSlotDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', description: 'Parking slot UUID' })
  @IsUUID()
  @IsNotEmpty()
  slotId: string;

  @ApiProperty({ example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', description: 'Target Unit UUID' })
  @IsUUID()
  @IsNotEmpty()
  unitId: string;

  @ApiPropertyOptional({ example: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', description: 'Resident User UUID' })
  @IsOptional()
  @IsUUID()
  residentId?: string;

  @ApiPropertyOptional({ example: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', description: 'Vehicle UUID' })
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiPropertyOptional({ enum: AllocationType, default: AllocationType.PRIMARY })
  @IsOptional()
  @IsEnum(AllocationType)
  allocationType: AllocationType = AllocationType.PRIMARY;

  @ApiProperty({ example: '2026-09-01' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiPropertyOptional({ example: '2027-08-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 500.0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyFee?: number;

  @ApiPropertyOptional({ example: 'Permanent allocation with unit deed' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateTransferRequestDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', description: 'Slot UUID to transfer' })
  @IsUUID()
  @IsNotEmpty()
  slotId: string;

  @ApiProperty({ example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', description: 'Target Unit UUID receiving the slot' })
  @IsUUID()
  @IsNotEmpty()
  toUnitId: string;

  @ApiProperty({ example: 'Mutual agreement between Unit 101 and Unit 202' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}

export class ActionTransferDto {
  @ApiProperty({
    enum: [TransferStatus.APPROVED, TransferStatus.REJECTED],
    example: TransferStatus.APPROVED,
  })
  @IsEnum(TransferStatus)
  status: TransferStatus.APPROVED | TransferStatus.REJECTED;

  @ApiPropertyOptional({ example: 'Approved by Managing Committee in meeting dated 10-Sep-2026' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  adminNotes?: string;
}

export class AssignVisitorParkingDto {
  @ApiPropertyOptional({
    description: 'Specific visitor slot UUID. If omitted, the first available visitor slot will be assigned',
  })
  @IsOptional()
  @IsUUID()
  slotId?: string;

  @ApiProperty({ example: 'MH02XY9999' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.replace(/\s+/g, '').toUpperCase() : value))
  vehicleRegistration: string;

  @ApiProperty({ example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', description: 'Unit visited' })
  @IsUUID()
  @IsNotEmpty()
  unitVisitedId: string;

  @ApiPropertyOptional({ example: 'Anand Verma (Guest)' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  visitorName?: string;

  @ApiPropertyOptional({ example: 'Expected departure 6:00 PM' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ParkingSlotQueryDto {
  @ApiPropertyOptional({ enum: ParkingSlotStatus })
  @IsOptional()
  @IsEnum(ParkingSlotStatus)
  status?: ParkingSlotStatus;

  @ApiPropertyOptional({ enum: ParkingSlotType })
  @IsOptional()
  @IsEnum(ParkingSlotType)
  slotType?: ParkingSlotType;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isVisitorSlot?: boolean;

  @ApiPropertyOptional({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @IsOptional()
  @IsUUID()
  towerId?: string;

  @ApiPropertyOptional({ description: 'Filter by slot number or floor' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
