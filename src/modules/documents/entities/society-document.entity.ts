import { Entity, Column, Index, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import {
  DocumentCategory,
  DocumentOwnerType,
  DocumentAccessLevel,
  DocumentStatus,
} from '../../../common/enums/document.enum';
import { DocumentAccessLog } from './document-access-log.entity';

/**
 * SocietyDocument Entity — Represents a single document (or document version) stored in the society repository.
 * Table: society_documents
 *
 * Version chain: A new version creates a new record with parent_document_id pointing to the previous version.
 * The latest version always has status = ACTIVE. Prior versions are ARCHIVED automatically.
 */
@Entity('society_documents')
@Index('IDX_sdoc_society_category', ['societyId', 'category'])
@Index('IDX_sdoc_society_status', ['societyId', 'status'])
@Index('IDX_sdoc_owner', ['societyId', 'ownerType', 'ownerId'])
@Index('IDX_sdoc_expiry', ['societyId', 'expiryDate'])
@Index('IDX_sdoc_parent', ['parentDocumentId'])
export class SocietyDocument extends BaseEntity {
  @Index('IDX_sdoc_society_id')
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Column({ type: 'enum', enum: DocumentCategory, default: DocumentCategory.OTHER })
  category: DocumentCategory;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'file_url', type: 'varchar', length: 500 })
  fileUrl: string;

  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  fileName: string;

  @Column({ name: 'file_size_bytes', type: 'int', nullable: true })
  fileSizeBytes: number | null;

  @Column({ name: 'mime_type', type: 'varchar', length: 100, nullable: true })
  mimeType: string | null;

  /**
   * Flat list of keyword tags for full-text-style search and filtering.
   */
  @Column({ type: 'jsonb', nullable: true })
  tags: string[] | null;

  /**
   * Polymorphic owner: the entity this document belongs to (e.g. a resident, vendor, asset).
   * Null means it belongs to the society itself.
   */
  @Column({ name: 'owner_type', type: 'enum', enum: DocumentOwnerType, nullable: true })
  ownerType: DocumentOwnerType | null;

  @Column({ name: 'owner_id', type: 'uuid', nullable: true })
  ownerId: string | null;

  /**
   * Certificate / license expiry date. When set, the scheduler will fire alerts
   * at 30 / 15 / 7 days before expiry.
   */
  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate: Date | null;

  @Column({ name: 'last_expiry_alert_sent_at', type: 'timestamp', nullable: true })
  lastExpiryAlertSentAt: Date | null;

  @Column({ name: 'is_pinned', type: 'boolean', default: false })
  isPinned: boolean;

  /**
   * Monotonically increasing version number within a document chain.
   * Version 1 = original upload. Each new version increments by 1.
   */
  @Column({ type: 'int', default: 1 })
  version: number;

  /**
   * Points to the immediate predecessor in the version chain.
   * Null for version 1 (the original document).
   */
  @Column({ name: 'parent_document_id', type: 'uuid', nullable: true })
  parentDocumentId: string | null;

  @ManyToOne(() => SocietyDocument, (doc) => doc.versions, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parent_document_id' })
  parentDocument: SocietyDocument | null;

  @OneToMany(() => SocietyDocument, (doc) => doc.parentDocument)
  versions: SocietyDocument[];

  /**
   * Visibility scope: who can read this document.
   */
  @Column({
    name: 'access_level',
    type: 'enum',
    enum: DocumentAccessLevel,
    default: DocumentAccessLevel.ADMIN_ONLY,
  })
  accessLevel: DocumentAccessLevel;

  @Column({ name: 'uploaded_by_user_id', type: 'uuid' })
  uploadedByUserId: string;

  @Column({ type: 'enum', enum: DocumentStatus, default: DocumentStatus.ACTIVE })
  status: DocumentStatus;

  @OneToMany(() => DocumentAccessLog, (log) => log.document)
  accessLogs: DocumentAccessLog[];
}
