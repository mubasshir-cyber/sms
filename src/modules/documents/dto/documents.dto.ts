import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsArray,
  IsBoolean,
  IsInt,
  IsPositive,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  DocumentCategory,
  DocumentOwnerType,
  DocumentAccessLevel,
  DocumentAction,
} from '../../../common/enums/document.enum';

// ─────────────────────────────────────────────
// Upload / Create Document
// ─────────────────────────────────────────────

export class UploadDocumentDto {
  @ApiProperty({ enum: DocumentCategory })
  @IsEnum(DocumentCategory)
  category: DocumentCategory;

  @ApiProperty({ example: 'Society Registration Certificate' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'https://storage.example.com/docs/reg-cert.pdf' })
  @IsUrl()
  fileUrl: string;

  @ApiProperty({ example: 'registration_certificate.pdf' })
  @IsString()
  @MaxLength(255)
  fileName: string;

  @ApiPropertyOptional({ example: 204800, description: 'File size in bytes' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  fileSizeBytes?: number;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  mimeType?: string;

  @ApiPropertyOptional({ type: [String], example: ['registration', 'certificate', '2026'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ enum: DocumentOwnerType })
  @IsOptional()
  @IsEnum(DocumentOwnerType)
  ownerType?: DocumentOwnerType;

  @ApiPropertyOptional({ description: 'UUID of the owner record (resident, vendor, etc.)' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ example: '2027-12-31', description: 'Certificate expiry date' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({ enum: DocumentAccessLevel })
  @IsOptional()
  @IsEnum(DocumentAccessLevel)
  accessLevel?: DocumentAccessLevel;
}

export class UpdateDocumentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ enum: DocumentAccessLevel })
  @IsOptional()
  @IsEnum(DocumentAccessLevel)
  accessLevel?: DocumentAccessLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}

// ─────────────────────────────────────────────
// Upload New Version
// ─────────────────────────────────────────────

export class UploadDocumentVersionDto {
  @ApiProperty({ example: 'https://storage.example.com/docs/reg-cert-v2.pdf' })
  @IsUrl()
  fileUrl: string;

  @ApiProperty({ example: 'registration_certificate_v2.pdf' })
  @IsString()
  @MaxLength(255)
  fileName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsPositive()
  fileSizeBytes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  mimeType?: string;

  @ApiPropertyOptional({ description: 'Change notes for this version' })
  @IsOptional()
  @IsString()
  description?: string;
}

// ─────────────────────────────────────────────
// Query / Filter
// ─────────────────────────────────────────────

export class DocumentFilterDto {
  @ApiPropertyOptional({ enum: DocumentCategory })
  @IsOptional()
  @IsEnum(DocumentCategory)
  category?: DocumentCategory;

  @ApiPropertyOptional({ enum: DocumentOwnerType })
  @IsOptional()
  @IsEnum(DocumentOwnerType)
  ownerType?: DocumentOwnerType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ enum: DocumentAccessLevel })
  @IsOptional()
  @IsEnum(DocumentAccessLevel)
  accessLevel?: DocumentAccessLevel;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  pinnedFirst?: boolean;
}

export class DocumentSearchDto {
  @ApiProperty({ example: 'fire safety' })
  @IsString()
  q: string;
}

// ─────────────────────────────────────────────
// Log Access
// ─────────────────────────────────────────────

export class LogDocumentAccessDto {
  @ApiProperty({ enum: DocumentAction })
  @IsEnum(DocumentAction)
  action: DocumentAction;

  @ApiPropertyOptional({ example: '192.168.1.1' })
  @IsOptional()
  @IsString()
  ipAddress?: string;
}
