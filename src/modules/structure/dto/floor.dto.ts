import { IsString, IsInt, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class CreateFloorDto {
  @IsUUID()
  towerId: string;

  @IsInt()
  floorNumber: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  displayName?: string;
}

export class UpdateFloorDto {
  @IsOptional()
  @IsInt()
  floorNumber?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  displayName?: string;
}
