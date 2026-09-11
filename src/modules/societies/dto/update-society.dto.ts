import { PartialType, OmitType } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';
import { CreateSocietyDto } from './create-society.dto';

/**
 * UpdateSocietyDto — all fields optional except tenantId cannot be changed.
 */
export class UpdateSocietyDto extends PartialType(
  OmitType(CreateSocietyDto, ['tenantId'] as const),
) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  /** Denormalized count — updated by structure module, not directly by API callers */
  @IsOptional()
  @IsInt()
  @Min(0)
  totalTowers?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalUnits?: number;
}
