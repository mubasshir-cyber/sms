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
  Matches,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleType, VehicleVerificationStatus } from '../../../common/enums/vehicle-parking.enum';

export class RegisterVehicleDto {
  @ApiPropertyOptional({
    description: 'Unit ID to link vehicle to. Required for Admin; defaults to resident unit if omitted',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsOptional()
  @IsUUID()
  unitId?: string;

  @ApiProperty({ enum: VehicleType, example: VehicleType.CAR })
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @ApiProperty({
    example: 'MH02AB1234',
    description: 'Vehicle registration plate number (alphanumeric)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.replace(/\s+/g, '').toUpperCase() : value))
  @Matches(/^[A-Z0-9-]+$/, {
    message: 'Registration number must only contain uppercase letters, numbers, and hyphens',
  })
  registrationNumber: string;

  @ApiPropertyOptional({ example: 'Tata Nexon EV' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  makeModel?: string;

  @ApiPropertyOptional({ example: 'White' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @ApiPropertyOptional({ example: 'RFID-98765432' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  rfidTag?: string;

  @ApiPropertyOptional({ example: 'FT-65432109' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fastagNumber?: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/rc-docs/mh02ab1234.pdf' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rcDocumentUrl?: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/insurance/mh02ab1234.pdf' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  insuranceDocumentUrl?: string;

  @ApiPropertyOptional({ example: '2027-08-31' })
  @IsOptional()
  @IsDateString()
  insuranceExpiryDate?: string;
}

export class UpdateVehicleDto {
  @ApiPropertyOptional({ enum: VehicleType })
  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @ApiPropertyOptional({ example: 'Tata Nexon EV Max' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  makeModel?: string;

  @ApiPropertyOptional({ example: 'Pearl White' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @ApiPropertyOptional({ example: 'RFID-98765432' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  rfidTag?: string;

  @ApiPropertyOptional({ example: 'FT-65432109' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fastagNumber?: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/rc-docs/mh02ab1234.pdf' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rcDocumentUrl?: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/insurance/mh02ab1234.pdf' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  insuranceDocumentUrl?: string;

  @ApiPropertyOptional({ example: '2027-08-31' })
  @IsOptional()
  @IsDateString()
  insuranceExpiryDate?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class VerifyVehicleDto {
  @ApiProperty({
    enum: [VehicleVerificationStatus.VERIFIED, VehicleVerificationStatus.REJECTED],
    example: VehicleVerificationStatus.VERIFIED,
  })
  @IsEnum(VehicleVerificationStatus)
  status: VehicleVerificationStatus.VERIFIED | VehicleVerificationStatus.REJECTED;

  @ApiPropertyOptional({
    example: 'RC document is blurry and registration plate is illegible',
    description: 'Mandatory if status is rejected',
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class VehicleQueryDto {
  @ApiPropertyOptional({ description: 'Filter by search term (plate, make/model, RFID)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by unit UUID' })
  @IsOptional()
  @IsUUID()
  unitId?: string;

  @ApiPropertyOptional({ enum: VehicleType })
  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @ApiPropertyOptional({ enum: VehicleVerificationStatus })
  @IsOptional()
  @IsEnum(VehicleVerificationStatus)
  verificationStatus?: VehicleVerificationStatus;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

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
