import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsNumber,
  IsPositive,
  IsArray,
  IsBoolean,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  AssetCategory,
  AssetStatus,
  MaintenanceType,
  MaintenanceLogStatus,
  MaintenanceFrequency,
  DepreciationMethod,
} from '../../../common/enums/asset.enum';

// ─────────────────────────────────────────────
// Asset DTOs
// ─────────────────────────────────────────────

export class CreateAssetDto {
  @ApiProperty({ enum: AssetCategory })
  @IsEnum(AssetCategory)
  category: AssetCategory;

  @ApiProperty({ example: 'Main Lobby Lift #1' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'Otis Gen2' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  model?: string;

  @ApiPropertyOptional({ example: 'Otis Elevator Company' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  manufacturer?: string;

  @ApiPropertyOptional({ example: 'OT-2024-001' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  serialNumber?: string;

  @ApiProperty({ example: 'Block A, Basement' })
  @IsString()
  @MaxLength(255)
  location: string;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  purchaseCost?: number;

  @ApiPropertyOptional({ example: '2027-01-14' })
  @IsOptional()
  @IsDateString()
  warrantyExpiryDate?: string;

  @ApiPropertyOptional({ description: 'UUID of the Vendor handling AMC' })
  @IsOptional()
  @IsUUID()
  amcVendorId?: string;

  @ApiPropertyOptional({ description: 'UUID of the VendorContract for AMC' })
  @IsOptional()
  @IsUUID()
  amcContractId?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  amcExpiryDate?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAssetDto extends PartialType(CreateAssetDto) {
  @ApiPropertyOptional({ enum: AssetStatus })
  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;
}

export class DisposeAssetDto {
  @ApiProperty({ example: '2026-09-11' })
  @IsDateString()
  disposalDate: string;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  disposalValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AssetFilterDto {
  @ApiPropertyOptional({ enum: AssetCategory })
  @IsOptional()
  @IsEnum(AssetCategory)
  category?: AssetCategory;

  @ApiPropertyOptional({ enum: AssetStatus })
  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;
}

// ─────────────────────────────────────────────
// Maintenance Log DTOs
// ─────────────────────────────────────────────

export class CreateMaintenanceLogDto {
  @ApiProperty({ enum: MaintenanceType })
  @IsEnum(MaintenanceType)
  maintenanceType: MaintenanceType;

  @ApiPropertyOptional({ example: 'LiftCo Technician' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  performedBy?: string;

  @ApiPropertyOptional({ description: 'UUID of Vendor who performed the maintenance' })
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @ApiProperty({ example: '2026-09-15' })
  @IsDateString()
  scheduledDate: string;

  @ApiPropertyOptional({ example: '2026-09-15' })
  @IsOptional()
  @IsDateString()
  completedDate?: string;

  @ApiPropertyOptional({ enum: MaintenanceLogStatus })
  @IsOptional()
  @IsEnum(MaintenanceLogStatus)
  status?: MaintenanceLogStatus;

  @ApiPropertyOptional({ example: 3500 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  findings?: string;

  @ApiPropertyOptional({ example: '2027-03-15' })
  @IsOptional()
  @IsDateString()
  nextMaintenanceDate?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentUrls?: string[];
}

export class UpdateMaintenanceLogDto extends PartialType(CreateMaintenanceLogDto) {}

// ─────────────────────────────────────────────
// Maintenance Schedule DTOs
// ─────────────────────────────────────────────

export class CreateMaintenanceScheduleDto {
  @ApiProperty({ enum: MaintenanceFrequency })
  @IsEnum(MaintenanceFrequency)
  frequency: MaintenanceFrequency;

  @ApiProperty({ example: '2026-10-01' })
  @IsDateString()
  nextDueDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateMaintenanceScheduleDto extends PartialType(CreateMaintenanceScheduleDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ─────────────────────────────────────────────
// Depreciation DTOs
// ─────────────────────────────────────────────

export class RecordDepreciationDto {
  @ApiProperty({ example: '2026-09-30' })
  @IsDateString()
  depreciationDate: string;

  @ApiProperty({ example: 25000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  depreciationAmount: number;

  @ApiProperty({ enum: DepreciationMethod })
  @IsEnum(DepreciationMethod)
  method: DepreciationMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
