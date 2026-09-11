import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  IsNumber,
  Min,
  Max,
  MaxLength,
  Matches,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  FacilityType,
  CapacityType,
  BookingSlotType,
} from '../../../common/enums/facility-booking.enum';

export class CreateFacilityDto {
  @ApiProperty({ example: 'Clubhouse Banquet Hall', description: 'Name of the facility/amenity' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiProperty({ enum: FacilityType, example: FacilityType.PARTY_HALL })
  @IsEnum(FacilityType)
  facilityType: FacilityType;

  @ApiPropertyOptional({
    enum: CapacityType,
    default: CapacityType.EXCLUSIVE,
    description: 'EXCLUSIVE (1 booking per time window) or SHARED (multiple bookings up to capacity)',
  })
  @IsOptional()
  @IsEnum(CapacityType)
  capacityType: CapacityType = CapacityType.EXCLUSIVE;

  @ApiPropertyOptional({ example: 'Fully air-conditioned banquet hall with stage, sound system, and pantry' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Clubhouse Ground Floor' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  location?: string;

  @ApiProperty({ example: 100, description: 'Maximum capacity (persons) of the facility' })
  @IsInt()
  @Min(1)
  capacity: number;

  @ApiPropertyOptional({ example: 'No loud music after 10:00 PM. Catering must use designated pantry.' })
  @IsOptional()
  @IsString()
  rules?: string;

  @ApiPropertyOptional({ example: ['https://storage.example.com/facilities/clubhouse-1.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @ApiPropertyOptional({ enum: BookingSlotType, default: BookingSlotType.HOURLY })
  @IsOptional()
  @IsEnum(BookingSlotType)
  bookingSlotType: BookingSlotType = BookingSlotType.HOURLY;

  @ApiPropertyOptional({ example: 60, default: 60, description: 'Duration in minutes per booking slot' })
  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(1440)
  slotDurationMinutes: number = 60;

  @ApiPropertyOptional({ example: '06:00', default: '06:00', description: 'Daily opening time in HH:mm (24h)' })
  @IsOptional()
  @IsString()
  @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'openTime must be a valid 24-hour time in HH:mm format (e.g. 06:00)',
  })
  openTime: string = '06:00';

  @ApiPropertyOptional({ example: '22:00', default: '22:00', description: 'Daily closing time in HH:mm (24h)' })
  @IsOptional()
  @IsString()
  @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'closeTime must be a valid 24-hour time in HH:mm format (e.g. 22:00)',
  })
  closeTime: string = '22:00';

  @ApiPropertyOptional({ example: 2500.0, default: 0.0, description: 'Booking fee in ₹' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bookingFee: number = 0.0;

  @ApiPropertyOptional({ example: 5000.0, default: 0.0, description: 'Refundable security deposit fee in ₹' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  depositFee: number = 0.0;

  @ApiPropertyOptional({ example: true, default: false, description: 'Requires committee/manager approval before confirmation' })
  @IsOptional()
  @IsBoolean()
  requiresApproval: boolean = false;

  @ApiPropertyOptional({ example: 4, default: 4, description: 'Max active bookings allowed per unit per calendar month' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxBookingsPerMonthPerUnit: number = 4;

  @ApiPropertyOptional({ example: 30, default: 30, description: 'Maximum advance booking window in days' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  advanceBookingDaysLimit: number = 30;

  @ApiPropertyOptional({ example: 24, default: 24, description: 'Cut-off hours before start time allowed for cancellation' })
  @IsOptional()
  @IsInt()
  @Min(0)
  cancellationHoursBefore: number = 24;
}

export class UpdateFacilityDto {
  @ApiPropertyOptional({ example: 'Clubhouse Banquet Hall Grand' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ enum: FacilityType })
  @IsOptional()
  @IsEnum(FacilityType)
  facilityType?: FacilityType;

  @ApiPropertyOptional({ enum: CapacityType })
  @IsOptional()
  @IsEnum(CapacityType)
  capacityType?: CapacityType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  location?: string;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rules?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @ApiPropertyOptional({ enum: BookingSlotType })
  @IsOptional()
  @IsEnum(BookingSlotType)
  bookingSlotType?: BookingSlotType;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(1440)
  slotDurationMinutes?: number;

  @ApiPropertyOptional({ example: '06:00' })
  @IsOptional()
  @IsString()
  @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'openTime must be a valid 24-hour time in HH:mm format',
  })
  openTime?: string;

  @ApiPropertyOptional({ example: '22:00' })
  @IsOptional()
  @IsString()
  @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'closeTime must be a valid 24-hour time in HH:mm format',
  })
  closeTime?: string;

  @ApiPropertyOptional({ example: 3000.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bookingFee?: number;

  @ApiPropertyOptional({ example: 5000.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  depositFee?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxBookingsPerMonthPerUnit?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  advanceBookingDaysLimit?: number;

  @ApiPropertyOptional({ example: 24 })
  @IsOptional()
  @IsInt()
  @Min(0)
  cancellationHoursBefore?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class FacilityQueryDto {
  @ApiPropertyOptional({ enum: FacilityType })
  @IsOptional()
  @IsEnum(FacilityType)
  facilityType?: FacilityType;

  @ApiPropertyOptional({ enum: CapacityType })
  @IsOptional()
  @IsEnum(CapacityType)
  capacityType?: CapacityType;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  requiresApproval?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Filter by facility name or location' })
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
