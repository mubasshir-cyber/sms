import {
  IsUUID, IsEnum, IsOptional, IsBoolean,
  IsString, IsDateString, MaxLength,
} from 'class-validator';
import { ResidentType } from '../../../common/enums/resident-type.enum';

export class CreateResidentDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  unitId: string;

  @IsEnum(ResidentType)
  type: ResidentType;

  @IsOptional()
  @IsDateString()
  moveInDate?: string;

  @IsOptional()
  @IsDateString()
  leaseStartDate?: string;

  @IsOptional()
  @IsDateString()
  leaseEndDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  emergencyContactPhone?: string;
}

export class UpdateResidentDto {
  @IsOptional()
  @IsEnum(ResidentType)
  type?: ResidentType;

  @IsOptional()
  @IsDateString()
  moveInDate?: string;

  @IsOptional()
  @IsDateString()
  moveOutDate?: string;

  @IsOptional()
  @IsDateString()
  leaseStartDate?: string;

  @IsOptional()
  @IsDateString()
  leaseEndDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  emergencyContactPhone?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateFamilyMemberDto {
  @IsString()
  @MaxLength(150)
  name: string;

  @IsString()
  @MaxLength(50)
  relationship: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsBoolean()
  isEmergencyContact?: boolean;
}

export class UpdateFamilyMemberDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  relationship?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsBoolean()
  isEmergencyContact?: boolean;
}
