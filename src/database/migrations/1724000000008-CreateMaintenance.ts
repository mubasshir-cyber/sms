import { MigrationInterface, QueryRunner, Table, TableIndex, TableUnique } from 'typeorm';

/**
 * Migration: CreateMaintenance
 * Creates: maintenance_heads, billing_rules, late_fee_configs, invoices
 * Depends on: societies (1724000000005)
 */
export class CreateMaintenance1724000000008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── maintenance_heads ────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'maintenance_heads',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'society_id', type: 'uuid', isNullable: false },
          { name: 'name', type: 'varchar', length: '100', isNullable: false },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'maintenance_heads',
      new TableIndex({ name: 'IDX_mhead_society_id', columnNames: ['society_id'] }),
    );

    // ─── billing_rules ────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'billing_rules',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'society_id', type: 'uuid', isNullable: false },
          { name: 'head_id', type: 'uuid', isNullable: false },
          {
            name: 'rule_type',
            type: 'enum',
            enum: ['per_unit', 'per_sqft', 'fixed'],
          },
          { name: 'amount', type: 'decimal', precision: 10, scale: 2, isNullable: false },
          {
            name: 'unit_type',
            type: 'enum',
            enum: ['studio', '1bhk', '2bhk', '3bhk', '4bhk', 'penthouse', 'shop', 'office', 'commercial'],
            isNullable: true,
          },
          { name: 'effective_from', type: 'date', isNullable: false },
          { name: 'effective_to', type: 'date', isNullable: true },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'billing_rules',
      new TableIndex({ name: 'IDX_brule_society_id', columnNames: ['society_id'] }),
    );

    // ─── late_fee_configs ─────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'late_fee_configs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'society_id', type: 'uuid', isNullable: false, isUnique: true },
          { name: 'fee_type', type: 'varchar', length: '10', isNullable: false }, // 'flat' | 'percent'
          { name: 'value', type: 'decimal', precision: 10, scale: 2, isNullable: false },
          { name: 'grace_period_days', type: 'int', default: 5 },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
        uniques: [
          new TableUnique({ name: 'IDX_lfc_society_id', columnNames: ['society_id'] }),
        ],
      }),
      true,
    );

    // ─── invoices ─────────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'invoices',
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
          { name: 'resident_id', type: 'uuid', isNullable: true },
          { name: 'invoice_number', type: 'varchar', length: '50', isNullable: false, isUnique: true },
          { name: 'billing_month', type: 'int', isNullable: false },
          { name: 'billing_year', type: 'int', isNullable: false },
          { name: 'due_date', type: 'date', isNullable: false },
          { name: 'subtotal', type: 'decimal', precision: 10, scale: 2, isNullable: false },
          { name: 'late_fee', type: 'decimal', precision: 10, scale: 2, default: 0 },
          { name: 'discount', type: 'decimal', precision: 10, scale: 2, default: 0 },
          { name: 'total_amount', type: 'decimal', precision: 10, scale: 2, isNullable: false },
          {
            name: 'status',
            type: 'enum',
            enum: ['draft', 'pending', 'paid', 'overdue', 'waived', 'partially_paid'],
            default: "'pending'",
          },
          { name: 'line_items', type: 'jsonb', default: "'[]'" },
          { name: 'paid_at', type: 'timestamp', isNullable: true },
          { name: 'pdf_url', type: 'varchar', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
        uniques: [
          new TableUnique({ name: 'IDX_invoice_number', columnNames: ['invoice_number'] }),
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'invoices',
      new TableIndex({ name: 'IDX_invoice_society_id', columnNames: ['society_id'] }),
    );
    await queryRunner.createIndex(
      'invoices',
      new TableIndex({ name: 'IDX_invoice_unit_id', columnNames: ['unit_id'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('invoices', true);
    await queryRunner.dropTable('late_fee_configs', true);
    await queryRunner.dropTable('billing_rules', true);
    await queryRunner.dropTable('maintenance_heads', true);
  }
}
