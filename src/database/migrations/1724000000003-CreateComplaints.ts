import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Migration: CreateComplaints
 * Creates: complaints, complaint_comments, sla_configs tables
 */
export class CreateComplaints1724000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── complaints ───────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'complaints',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'society_id', type: 'uuid', isNullable: false },
          { name: 'unit_id', type: 'uuid', isNullable: false },
          { name: 'resident_id', type: 'uuid', isNullable: false },
          { name: 'title', type: 'varchar', length: '200', isNullable: false },
          { name: 'description', type: 'text', isNullable: false },
          {
            name: 'category',
            type: 'enum',
            enum: [
              'plumbing', 'electrical', 'lift', 'security', 'housekeeping',
              'parking', 'water_supply', 'structural', 'internet_cctv', 'other',
            ],
            default: "'other'",
          },
          {
            name: 'priority',
            type: 'enum',
            enum: ['low', 'medium', 'high', 'critical'],
            default: "'medium'",
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['open', 'assigned', 'in_progress', 'resolved', 'closed', 'escalated'],
            default: "'open'",
          },
          { name: 'photo_urls', type: 'jsonb', default: "'[]'" },
          { name: 'assigned_to_user_id', type: 'uuid', isNullable: true },
          { name: 'sla_deadline', type: 'timestamp', isNullable: true },
          { name: 'resolved_at', type: 'timestamp', isNullable: true },
          { name: 'closed_at', type: 'timestamp', isNullable: true },
          { name: 'escalated_at', type: 'timestamp', isNullable: true },
          { name: 'is_escalated', type: 'boolean', default: false },
          { name: 'resident_rating', type: 'int', isNullable: true },
          { name: 'resident_feedback', type: 'text', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'complaints',
      new TableIndex({ name: 'IDX_complaints_society_id', columnNames: ['society_id'] }),
    );
    await queryRunner.createIndex(
      'complaints',
      new TableIndex({ name: 'IDX_complaints_unit_id', columnNames: ['unit_id'] }),
    );
    await queryRunner.createIndex(
      'complaints',
      new TableIndex({ name: 'IDX_complaints_status', columnNames: ['status'] }),
    );
    await queryRunner.createIndex(
      'complaints',
      new TableIndex({ name: 'IDX_complaints_priority', columnNames: ['priority'] }),
    );
    await queryRunner.createIndex(
      'complaints',
      new TableIndex({ name: 'IDX_complaints_assigned_to', columnNames: ['assigned_to_user_id'] }),
    );

    // ─── complaint_comments ───────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'complaint_comments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'complaint_id', type: 'uuid', isNullable: false },
          { name: 'user_id', type: 'uuid', isNullable: false },
          {
            name: 'user_role',
            type: 'enum',
            enum: [
              'super_admin', 'society_admin', 'committee_member', 'accountant',
              'facility_manager', 'resident', 'tenant', 'security_guard', 'vendor',
            ],
          },
          { name: 'user_name', type: 'varchar', length: '150', isNullable: false },
          { name: 'message', type: 'text', isNullable: false },
          { name: 'is_internal', type: 'boolean', default: false },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'complaint_comments',
      new TableIndex({
        name: 'IDX_complaint_comments_complaint_id',
        columnNames: ['complaint_id'],
      }),
    );

    // ─── sla_configs ──────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'sla_configs',
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
            enum: [
              'plumbing', 'electrical', 'lift', 'security', 'housekeeping',
              'parking', 'water_supply', 'structural', 'internet_cctv', 'other',
            ],
          },
          { name: 'resolution_hours', type: 'int', isNullable: false },
          { name: 'escalation_hours', type: 'int', isNullable: false },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
        uniques: [
          { name: 'UQ_sla_configs_society_category', columnNames: ['society_id', 'category'] },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'sla_configs',
      new TableIndex({ name: 'IDX_sla_configs_society_id', columnNames: ['society_id'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('sla_configs', true);
    await queryRunner.dropTable('complaint_comments', true);
    await queryRunner.dropTable('complaints', true);
  }
}
