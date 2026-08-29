import {
  IsString,
  IsEmail,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsObject,
  MaxLength,
  MinLength,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSocietyAddressDto {
  @IsString()
  @MinLength(2)
  @MaxLength(300)
  street: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  locality?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  state: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'pincode must be a 6-digit number' })
  pincode: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;
}

export class CreateSocietyDto {
  /**
   * The tenant this society belongs to.
   * Required when creating via SUPER_ADMIN.
   * SOCIETY_ADMIN cannot specify this (uses their own tenantId).
   */
  @IsUUID()
  tenantId: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  /**
   * URL-safe slug unique across the platform.
   * Only lowercase letters, numbers, hyphens.
   */
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateSocietyAddressDto)
  address?: CreateSocietyAddressDto;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  registrationNo?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, {
    message: 'Invalid GST number format',
  })
  gstNo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  timezone?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  contactPhone?: string;

  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}
