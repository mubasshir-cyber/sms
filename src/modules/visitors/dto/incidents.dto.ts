import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IncidentType,
  IncidentSeverity,
  IncidentStatus,
} from '../../../common/enums/visitor.enum';

export class CreateIncidentDto {
  @ApiPropertyOptional({ description: 'Gate ID where incident occurred' })
  @IsUUID()
  @IsOptional()
  gateId?: string;

  @ApiProperty({ enum: IncidentType, default: IncidentType.OTHER })
  @IsEnum(IncidentType)
  @IsNotEmpty()
  incidentType: IncidentType;

  @ApiPropertyOptional({ enum: IncidentSeverity, default: IncidentSeverity.LOW })
  @IsEnum(IncidentSeverity)
  @IsOptional()
  severity?: IncidentSeverity;

  @ApiProperty({ description: 'Short summary of the incident', example: 'Unauthorized tailgating through Main Gate' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Detailed description of the incident' })
  @IsString()
  @IsNotEmpty()
  description: string;
}

export class ResolveIncidentDto {
  @ApiProperty({ description: 'Resolution notes and actions taken', example: 'Guard warned the driver and verified vehicle registration' })
  @IsString()
  @IsNotEmpty()
  resolutionNotes: string;

  @ApiPropertyOptional({ enum: IncidentStatus, default: IncidentStatus.RESOLVED })
  @IsEnum(IncidentStatus)
  @IsOptional()
  status?: IncidentStatus;
}
