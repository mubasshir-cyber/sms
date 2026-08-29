import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsPhoneNumber,
  IsInt,
  Min,
  MaxLength,
  MinLength,
  Matches,
  IsDateString,
  IsObject,
} from 'class-validator';
import { Plan } from '../../../common/enums/plan.enum';

export class CreateTenantDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  /**
   * URL-safe slug. Only lowercase letters, numbers, hyphens.
   * e.g. "green-valley"
   */
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @IsString()
  @MinLength(2)
  @MaxLength(150)
  contactName: string;

  @IsEmail()
  contactEmail: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  contactPhone?: string;

  @IsOptional()
  @IsEnum(Plan)
  plan?: Plan;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxSocieties?: number;

  @IsOptional()
  @IsDateString()
  planExpiresAt?: string;

  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}
