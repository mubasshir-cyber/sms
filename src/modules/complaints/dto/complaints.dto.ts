import {
  IsString, IsNotEmpty, IsEnum, IsOptional, IsArray,
  IsUrl, MaxLength, IsUUID, IsInt, Min, Max, IsBoolean,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { ComplaintCategory, ComplaintPriority, ComplaintStatus } from '../../../common/enums/complaint.enum';

// ─── Create Complaint ─────────────────────────────────────────────────────────

export class CreateComplaintDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(ComplaintCategory)
  category: ComplaintCategory;

  @IsEnum(ComplaintPriority)
  priority: ComplaintPriority;

  /** Optional S3/R2 photo URLs attached at creation (max 5) */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsUrl({}, { each: true })
  photoUrls?: string[];
}

// ─── Update Complaint (admin) ─────────────────────────────────────────────────

export class UpdateComplaintDto extends PartialType(CreateComplaintDto) {}

// ─── Assign Complaint ─────────────────────────────────────────────────────────

export class AssignComplaintDto {
  @IsUUID()
  assignedToUserId: string;
}

// ─── Update Status ────────────────────────────────────────────────────────────

export class UpdateStatusDto {
  @IsEnum(ComplaintStatus)
  status: ComplaintStatus;

  /** Optional internal note to accompany the status change */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

// ─── Add Comment ─────────────────────────────────────────────────────────────

export class AddCommentDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  /**
   * If true, only admin-level roles can see this comment.
   * Residents are NOT allowed to set this — enforced in service.
   */
  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}

// ─── Close Complaint (Resident) ───────────────────────────────────────────────

export class CloseComplaintDto {
  /** Star rating 1–5 */
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  feedback?: string;
}

// ─── SLA Config ───────────────────────────────────────────────────────────────

export class UpsertSlaConfigDto {
  @IsEnum(ComplaintCategory)
  category: ComplaintCategory;

  /** Hours to resolve before SLA breach (e.g., 24) */
  @IsInt()
  @Min(1)
  resolutionHours: number;

  /** Hours after which auto-escalation triggers (e.g., 48) */
  @IsInt()
  @Min(1)
  escalationHours: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ─── Query / Filter ───────────────────────────────────────────────────────────

export class ComplaintQueryDto {
  @IsOptional()
  @IsEnum(ComplaintStatus)
  status?: ComplaintStatus;

  @IsOptional()
  @IsEnum(ComplaintPriority)
  priority?: ComplaintPriority;

  @IsOptional()
  @IsEnum(ComplaintCategory)
  category?: ComplaintCategory;

  @IsOptional()
  @IsUUID()
  unitId?: string;

  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
