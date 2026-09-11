import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { DocumentAction } from '../../../common/enums/document.enum';
import { SocietyDocument } from './society-document.entity';

/**
 * DocumentAccessLog Entity — Immutable audit record of every access event on a document.
 * Table: document_access_logs
 *
 * No soft-delete; this table is append-only.
 * Does NOT extend BaseEntity to avoid the unnecessary updated_at / deleted_at overhead
 * on an immutable audit log.
 */
@Entity('document_access_logs')
@Index('IDX_dal_document_id', ['documentId'])
@Index('IDX_dal_society_user', ['societyId', 'userId'])
@Index('IDX_dal_accessed_at', ['societyId', 'accessedAt'])
export class DocumentAccessLog {
  @Column({
    type: 'uuid',
    primary: true,
    generated: 'uuid',
  })
  id: string;

  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Column({ name: 'document_id', type: 'uuid' })
  documentId: string;

  @ManyToOne(() => SocietyDocument, (doc) => doc.accessLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'document_id' })
  document: SocietyDocument;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: DocumentAction })
  action: DocumentAction;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({
    name: 'accessed_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  accessedAt: Date;
}
