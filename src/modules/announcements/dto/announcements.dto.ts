import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsInt,
  IsArray,
  ArrayMaxSize,
  IsUrl,
  MaxLength,
  Min,
  Max,
  IsISO8601,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AnnouncementType,
  AnnouncementStatus,
  AnnouncementPriority,
  AnnouncementTargetScope,
  AnnouncementTargetRole,
} from '../../../common/enums/announcement.enum';

// ─── Create ────────────────────────────────────────────────────────────────────

export class CreateAnnouncementDto {
  @ApiProperty({ example: 'Water Supply Disruption on 7th September' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title: string;

  /**
   * Rich HTML body — sanitized before storage.
   * Provide valid HTML; the service applies sanitize-html with a safe allow-list.
   */
  @ApiProperty({ example: '<p>Dear Residents,</p><p>Water supply will be <b>unavailable</b> from 9AM–12PM on 7th Sept.</p>' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({ enum: AnnouncementType, default: AnnouncementType.GENERAL })
  @IsOptional()
  @IsEnum(AnnouncementType)
  type?: AnnouncementType;

  @ApiPropertyOptional({
    description: 'Up to 5 publicly accessible attachment URLs (PDF / Image)',
    type: [String],
    example: ['https://cdn.example.com/docs/notice.pdf'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5, { message: 'Maximum 5 attachments allowed' })
  @IsUrl({}, { each: true })
  attachmentUrls?: string[];

  @ApiPropertyOptional({ enum: AnnouncementTargetScope, default: AnnouncementTargetScope.SOCIETY })
  @IsOptional()
  @IsEnum(AnnouncementTargetScope)
  targetScope?: AnnouncementTargetScope;

  @ApiPropertyOptional({ description: 'Tower UUID — required when targetScope = tower or floor' })
  @IsOptional()
  @IsUUID()
  targetTowerId?: string;

  @ApiPropertyOptional({ description: 'Floor UUID — required when targetScope = floor' })
  @IsOptional()
  @IsUUID()
  targetFloorId?: string;

  @ApiPropertyOptional({ description: 'Unit UUID — required when targetScope = unit' })
  @IsOptional()
  @IsUUID()
  targetUnitId?: string;

  @ApiPropertyOptional({ enum: AnnouncementTargetRole, description: 'Required when targetScope = role_group' })
  @IsOptional()
  @IsEnum(AnnouncementTargetRole)
  targetRole?: AnnouncementTargetRole;

  @ApiPropertyOptional({ enum: AnnouncementPriority, default: AnnouncementPriority.NORMAL })
  @IsOptional()
  @IsEnum(AnnouncementPriority)
  priority?: AnnouncementPriority;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional({
    description: 'Auto-expire timestamp — announcement archived after this time',
    example: '2026-10-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}

// ─── Update ───────────────────────────────────────────────────────────────────

export class UpdateAnnouncementDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ enum: AnnouncementType })
  @IsOptional()
  @IsEnum(AnnouncementType)
  type?: AnnouncementType;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsUrl({}, { each: true })
  attachmentUrls?: string[];

  @ApiPropertyOptional({ enum: AnnouncementTargetScope })
  @IsOptional()
  @IsEnum(AnnouncementTargetScope)
  targetScope?: AnnouncementTargetScope;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  targetTowerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  targetFloorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  targetUnitId?: string;

  @ApiPropertyOptional({ enum: AnnouncementTargetRole })
  @IsOptional()
  @IsEnum(AnnouncementTargetRole)
  targetRole?: AnnouncementTargetRole;

  @ApiPropertyOptional({ enum: AnnouncementPriority })
  @IsOptional()
  @IsEnum(AnnouncementPriority)
  priority?: AnnouncementPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}

// ─── Publish ──────────────────────────────────────────────────────────────────

export class PublishAnnouncementDto {
  @ApiPropertyOptional({
    description: 'Schedule for future publish. Omit for immediate publish.',
    example: '2026-09-07T09:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  publishAt?: string;
}

// ─── Query ────────────────────────────────────────────────────────────────────

export class AnnouncementQueryDto {
  @ApiPropertyOptional({ enum: AnnouncementType })
  @IsOptional()
  @IsEnum(AnnouncementType)
  type?: AnnouncementType;

  @ApiPropertyOptional({ enum: AnnouncementStatus })
  @IsOptional()
  @IsEnum(AnnouncementStatus)
  status?: AnnouncementStatus;

  @ApiPropertyOptional({ enum: AnnouncementPriority })
  @IsOptional()
  @IsEnum(AnnouncementPriority)
  priority?: AnnouncementPriority;

  @ApiPropertyOptional({ description: 'Filter pinned announcements only', example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional({ description: 'Filter by target tower UUID' })
  @IsOptional()
  @IsUUID()
  towerId?: string;

  @ApiPropertyOptional({ description: 'Search in title' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
