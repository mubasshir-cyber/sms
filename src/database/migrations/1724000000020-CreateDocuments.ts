import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Migration: CreateDocuments
 * Creates: society_documents, document_access_logs
 * Depends on: societies (1724000000005), users (1724000000001)
 */
export class CreateDocuments1724000000020 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── 1. society_documents ────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'society_documents',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'society_id', type: 'uuid', isNullable: false },
          {
            name: 'category',
            type: 'enum',
            enum: ['society', 'resident', 'vendor', 'finance', 'legal', 'compliance', 'meeting', 'other'],
            default: "'other'",
            isNullable: false,
          },
          { name: 'title', type: 'varchar', length: '255', isNullable: false },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'file_url', type: 'varchar', length: '500', isNullable: false },
          { name: 'file_name', type: 'varchar', length: '255', isNullable: false },
          { name: 'file_size_bytes', type: 'int', isNullable: true },
          { name: 'mime_type', type: 'varchar', length: '100', isNullable: true },
          { name: 'tags', type: 'jsonb', isNullable: true },
          {
            name: 'owner_type',
            type: 'enum',
            enum: ['society', 'resident', 'vendor', 'staff', 'asset'],
            isNullable: true,
          },
          { name: 'owner_id', type: 'uuid', isNullable: true },
          { name: 'expiry_date', type: 'date', isNullable: true },
          { name: 'last_expiry_alert_sent_at', type: 'timestamp', isNullable: true },
          { name: 'is_pinned', type: 'boolean', default: false, isNullable: false },
          { name: 'version', type: 'int', default: 1, isNullable: false },
          { name: 'parent_document_id', type: 'uuid', isNullable: true },
          {
            name: 'access_level',
            type: 'enum',
            enum: ['admin_only', 'committee', 'all_residents'],
            default: "'admin_only'",
            isNullable: false,
          },
          { name: 'uploaded_by_user_id', type: 'uuid', isNullable: false },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'archived'],
            default: "'active'",
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
        foreignKeys: [
          {
            columnNames: ['parent_document_id'],
            referencedTableName: 'society_documents',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'society_documents',
      new TableIndex({ name: 'IDX_sdoc_society_id', columnNames: ['society_id'] }),
    );
    await queryRunner.createIndex(
      'society_documents',
      new TableIndex({ name: 'IDX_sdoc_society_category', columnNames: ['society_id', 'category'] }),
    );
    await queryRunner.createIndex(
      'society_documents',
      new TableIndex({ name: 'IDX_sdoc_society_status', columnNames: ['society_id', 'status'] }),
    );
    await queryRunner.createIndex(
      'society_documents',
      new TableIndex({ name: 'IDX_sdoc_owner', columnNames: ['society_id', 'owner_type', 'owner_id'] }),
    );
    await queryRunner.createIndex(
      'society_documents',
      new TableIndex({ name: 'IDX_sdoc_expiry', columnNames: ['society_id', 'expiry_date'] }),
    );
    await queryRunner.createIndex(
      'society_documents',
      new TableIndex({ name: 'IDX_sdoc_parent', columnNames: ['parent_document_id'] }),
    );

    // ─── 2. document_access_logs ─────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'document_access_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'society_id', type: 'uuid', isNullable: false },
          { name: 'document_id', type: 'uuid', isNullable: false },
          { name: 'user_id', type: 'uuid', isNullable: false },
          {
            name: 'action',
            type: 'enum',
            enum: ['viewed', 'downloaded', 'deleted', 'version_uploaded'],
            isNullable: false,
          },
          { name: 'ip_address', type: 'varchar', length: '45', isNullable: true },
          {
            name: 'accessed_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['document_id'],
            referencedTableName: 'society_documents',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'document_access_logs',
      new TableIndex({ name: 'IDX_dal_document_id', columnNames: ['document_id'] }),
    );
    await queryRunner.createIndex(
      'document_access_logs',
      new TableIndex({ name: 'IDX_dal_society_user', columnNames: ['society_id', 'user_id'] }),
    );
    await queryRunner.createIndex(
      'document_access_logs',
      new TableIndex({ name: 'IDX_dal_accessed_at', columnNames: ['society_id', 'accessed_at'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('document_access_logs', true);
    await queryRunner.dropTable('society_documents', true);
  }
}
