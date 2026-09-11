import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  IsInt,
  Min,
  Max,
  MaxLength,
  Matches,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus } from '../../../common/enums/facility-booking.enum';

export class CreateBookingDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', description: 'Facility UUID' })
  @IsUUID()
  @IsNotEmpty()
  facilityId: string;

  @ApiPropertyOptional({
    example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    description: 'Unit UUID booking the facility. Defaults to resident unit if omitted by resident',
  })
  @IsOptional()
  @IsUUID()
  unitId?: string;

  @ApiProperty({ example: '2026-09-20', description: 'Date of booking in YYYY-MM-DD format' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'bookingDate must be in YYYY-MM-DD format' })
  bookingDate: string;

  @ApiProperty({ example: '18:00', description: 'Start time in 24h format (HH:mm)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:mm format (e.g. 18:00)',
  })
  startTime: string;

  @ApiProperty({ example: '21:00', description: 'End time in 24h format (HH:mm)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime must be in HH:mm format (e.g. 21:00)',
  })
  endTime: string;

  @ApiPropertyOptional({ example: 25, default: 1, description: 'Number of expected attendees / players' })
  @IsOptional()
  @IsInt()
  @Min(1)
  attendeesCount: number = 1;

  @ApiPropertyOptional({ example: 'Family birthday gathering', description: 'Purpose or description of the event' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  purpose?: string;
}

export class ActionBookingDto {
  @ApiProperty({
    enum: [BookingStatus.CONFIRMED, BookingStatus.REJECTED],
    example: BookingStatus.CONFIRMED,
  })
  @IsEnum(BookingStatus)
  status: BookingStatus.CONFIRMED | BookingStatus.REJECTED;

  @ApiPropertyOptional({
    example: 'Slot is reserved for annual society maintenance during this time',
    description: 'Mandatory when rejecting a booking request',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}

export class CancelBookingDto {
  @ApiPropertyOptional({ example: 'Change of plans, event rescheduled', description: 'Reason for cancellation' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class AvailabilityQueryDto {
  @ApiProperty({ example: '2026-09-20', description: 'Date to query availability for (YYYY-MM-DD)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be in YYYY-MM-DD format' })
  date: string;
}

export class BookingQueryDto {
  @ApiPropertyOptional({ description: 'Filter by facility UUID' })
  @IsOptional()
  @IsUUID()
  facilityId?: string;

  @ApiPropertyOptional({ description: 'Filter by unit UUID' })
  @IsOptional()
  @IsUUID()
  unitId?: string;

  @ApiPropertyOptional({ enum: BookingStatus })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({ example: '2026-09-01', description: 'From date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ example: '2026-09-30', description: 'To date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

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
