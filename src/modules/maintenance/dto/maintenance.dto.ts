import {
  IsString, IsEnum, IsOptional, IsBoolean, IsUUID,
  IsNumber, IsInt, Min, MaxLength, IsDateString,
} from 'class-validator';
import { BillingRuleType } from '../../../common/enums/billing.enum';
import { UnitType } from '../../../common/enums/unit-type.enum';

// ─── Maintenance Head DTOs ────────────────────────────────────────────────────

export class CreateMaintenanceHeadDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateMaintenanceHeadDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ─── Billing Rule DTOs ───────────────────────────────────────────────────────

export class CreateBillingRuleDto {
  @IsUUID()
  headId: string;

  @IsEnum(BillingRuleType)
  ruleType: BillingRuleType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @IsOptional()
  @IsEnum(UnitType)
  unitType?: UnitType;

  @IsDateString()
  effectiveFrom: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}

export class UpdateBillingRuleDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ─── Late Fee Config DTOs ─────────────────────────────────────────────────────

export class UpsertLateFeeConfigDto {
  @IsEnum(['flat', 'percent'])
  feeType: 'flat' | 'percent';

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  value: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  gracePeriodDays?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ─── Invoice DTOs ─────────────────────────────────────────────────────────────

export class GenerateInvoicesDto {
  @IsInt()
  @Min(1)
  month: number;

  @IsInt()
  year: number;

  @IsOptional()
  @IsUUID()
  unitId?: string; // if provided, generate only for this unit
}

export class WaiveInvoiceDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discount: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
