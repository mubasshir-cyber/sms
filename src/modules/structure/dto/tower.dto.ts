import { IsString, IsInt, IsOptional, IsBoolean, Min, MaxLength, MinLength } from 'class-validator';

export class CreateTowerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  totalFloors?: number;
}

export class UpdateTowerDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  totalFloors?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
