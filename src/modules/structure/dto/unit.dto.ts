import {
  IsString, IsUUID, IsEnum, IsOptional, IsBoolean,
  IsNumber, IsInt, Min, MaxLength,
} from 'class-validator';
import { UnitType, UnitStatus } from '../../../common/enums/unit-type.enum';

export class CreateUnitDto {
  @IsUUID()
  towerId: string;

  @IsUUID()
  floorId: string;

  @IsString()
  @MaxLength(20)
  unitNumber: string;

  @IsEnum(UnitType)
  type: UnitType;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  sqFt?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bathrooms?: number;
}

export class UpdateUnitDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  unitNumber?: string;

  @IsOptional()
  @IsEnum(UnitType)
  type?: UnitType;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  sqFt?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bathrooms?: number;

  @IsOptional()
  @IsEnum(UnitStatus)
  status?: UnitStatus;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
