import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { GateType } from '../../../common/enums/visitor.enum';

export class CreateGateDto {
  @ApiProperty({ description: 'Name of the gate', example: 'Main Gate - North' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ enum: GateType, default: GateType.ENTRY_EXIT })
  @IsEnum(GateType)
  @IsOptional()
  gateType?: GateType;

  @ApiPropertyOptional({ description: 'Location details', example: 'Beside Tower A entry road' })
  @IsString()
  @IsOptional()
  locationDescription?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateGateDto extends PartialType(CreateGateDto) {}

export class AssignGuardDto {
  @ApiProperty({ description: 'Guard user ID (must have security_guard role)', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @IsUUID()
  @IsNotEmpty()
  guardUserId: string;

  @ApiPropertyOptional({ description: 'Shift label', example: 'Morning Shift (06:00 - 14:00)' })
  @IsString()
  @IsOptional()
  shiftName?: string;

  @ApiProperty({ description: 'Shift start timestamp', example: '2026-09-05T06:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  shiftStart: string;

  @ApiProperty({ description: 'Shift end timestamp', example: '2026-09-05T14:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  shiftEnd: string;

  @ApiPropertyOptional({ description: 'Shift notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
