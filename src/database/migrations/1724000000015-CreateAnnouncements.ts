import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Migration: CreateAnnouncements
 * Creates: announcements, announcement_reads
 * Depends on: societies (1724000000005), users (1724000000001)
 */
export class CreateAnnouncements1724000000015 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── 1. announcements ────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'announcements',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'society_id', type: 'uuid', isNullable: false },
          { name: 'title', type: 'varchar', length: '300', isNullable: false },
          { name: 'body', type: 'text', isNullable: false },
          {
            name: 'type',
            type: 'enum',
            enum: [
              'general', 'circular', 'emergency', 'event', 'maintenance',
              'water_shutdown', 'electricity_shutdown', 'agm', 'other',
            ],
            default: "'general'",
            isNullable: false,
          },
          {
            name: 'attachment_urls',
            type: 'varchar',
            isArray: true,
            default: "'{}'",
            isNullable: true,
          },
          {
            name: 'target_scope',
            type: 'enum',
            enum: ['society', 'tower', 'floor', 'unit', 'role_group'],
            default: "'society'",
            isNullable: false,
          },
          { name: 'target_tower_id', type: 'uuid', isNullable: true },
          { name: 'target_floor_id', type: 'uuid', isNullable: true },
          { name: 'target_unit_id', type: 'uuid', isNullable: true },
          {
            name: 'target_role',
            type: 'enum',
            enum: ['all_residents', 'owner', 'tenant'],
            isNullable: true,
          },
          { name: 'is_pinned', type: 'boolean', default: false },
          {
            name: 'priority',
            type: 'enum',
            enum: ['low', 'normal', 'high', 'urgent'],
            default: "'normal'",
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['draft', 'scheduled', 'published', 'archived'],
            default: "'draft'",
            isNullable: false,
          },
          { name: 'publish_at', type: 'timestamp', isNullable: true },
          { name: 'published_at', type: 'timestamp', isNullable: true },
          { name: 'expires_at', type: 'timestamp', isNullable: true },
          { name: 'created_by_user_id', type: 'uuid', isNullable: false },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'announcements',
      new TableIndex({
        name: 'IDX_announcements_society_status_pinned',
        columnNames: ['society_id', 'status', 'is_pinned'],
      }),
    );
    await queryRunner.createIndex(
      'announcements',
      new TableIndex({
        name: 'IDX_announcements_society_type',
        columnNames: ['society_id', 'type'],
      }),
    );
    await queryRunner.createIndex(
      'announcements',
      new TableIndex({
        name: 'IDX_announcements_published_at',
        columnNames: ['society_id', 'published_at'],
      }),
    );
    await queryRunner.createIndex(
      'announcements',
      new TableIndex({
        name: 'IDX_announcements_expires_at',
        columnNames: ['expires_at'],
      }),
    );

    // ─── 2. announcement_reads ────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'announcement_reads',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'society_id', type: 'uuid', isNullable: false },
          { name: 'announcement_id', type: 'uuid', isNullable: false },
          { name: 'user_id', type: 'uuid', isNullable: false },
          { name: 'read_at', type: 'timestamp', isNullable: false },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
        uniques: [
          {
            name: 'UQ_announcement_reads_announcement_user',
            columnNames: ['announcement_id', 'user_id'],
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'announcement_reads',
      new TableIndex({
        name: 'IDX_announcement_reads_announcement_id',
        columnNames: ['announcement_id'],
      }),
    );
    await queryRunner.createIndex(
      'announcement_reads',
      new TableIndex({
        name: 'IDX_announcement_reads_user_id',
        columnNames: ['user_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('announcement_reads', true);
    await queryRunner.dropTable('announcements', true);
  }
}
