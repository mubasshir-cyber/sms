import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Migration: CreateAssets
 * Creates: assets, asset_maintenance_logs, asset_maintenance_schedules, asset_depreciation_logs
 * Depends on: societies (1724000000005), vendors (1724000000018)
 */
export class CreateAssets1724000000019 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── 1. assets ───────────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'assets',
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
              'lift',
              'generator',
              'pump_motor',
              'cctv',
              'fire_safety',
              'gym_equipment',
              'furniture',
              'electrical_panel',
              'water_tank',
              'other',
            ],
            default: "'other'",
            isNullable: false,
          },
          { name: 'name', type: 'varchar', length: '200', isNullable: false },
          { name: 'model', type: 'varchar', length: '150', isNullable: true },
          { name: 'manufacturer', type: 'varchar', length: '150', isNullable: true },
          { name: 'serial_number', type: 'varchar', length: '100', isNullable: true },
          { name: 'location', type: 'varchar', length: '255', isNullable: false },
          { name: 'purchase_date', type: 'date', isNullable: true },
          { name: 'purchase_cost', type: 'decimal', precision: 10, scale: 2, isNullable: true },
          { name: 'current_value', type: 'decimal', precision: 10, scale: 2, isNullable: true },
          { name: 'warranty_expiry_date', type: 'date', isNullable: true },
          { name: 'amc_vendor_id', type: 'uuid', isNullable: true },
          { name: 'amc_contract_id', type: 'uuid', isNullable: true },
          { name: 'amc_expiry_date', type: 'date', isNullable: true },
          { name: 'last_warranty_alert_sent_at', type: 'timestamp', isNullable: true },
          { name: 'last_amc_alert_sent_at', type: 'timestamp', isNullable: true },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'under_maintenance', 'disposed'],
            default: "'active'",
            isNullable: false,
          },
          { name: 'disposal_date', type: 'date', isNullable: true },
          { name: 'disposal_value', type: 'decimal', precision: 10, scale: 2, isNullable: true },
          { name: 'photo_urls', type: 'jsonb', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
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
      }),
      true,
    );

    await queryRunner.createIndex(
      'assets',
      new TableIndex({ name: 'IDX_assets_society_id', columnNames: ['society_id'] }),
    );
    await queryRunner.createIndex(
      'assets',
      new TableIndex({ name: 'IDX_assets_society_category', columnNames: ['society_id', 'category'] }),
    );
    await queryRunner.createIndex(
      'assets',
      new TableIndex({ name: 'IDX_assets_society_status', columnNames: ['society_id', 'status'] }),
    );
    await queryRunner.createIndex(
      'assets',
      new TableIndex({ name: 'IDX_assets_warranty_expiry', columnNames: ['society_id', 'warranty_expiry_date'] }),
    );
    await queryRunner.createIndex(
      'assets',
      new TableIndex({ name: 'IDX_assets_amc_expiry', columnNames: ['society_id', 'amc_expiry_date'] }),
    );

    // ─── 2. asset_maintenance_logs ───────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'asset_maintenance_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'society_id', type: 'uuid', isNullable: false },
          { name: 'asset_id', type: 'uuid', isNullable: false },
          {
            name: 'maintenance_type',
            type: 'enum',
            enum: ['preventive', 'corrective', 'inspection', 'amc_visit'],
            isNullable: false,
          },
          { name: 'performed_by', type: 'varchar', length: '200', isNullable: true },
          { name: 'vendor_id', type: 'uuid', isNullable: true },
          { name: 'scheduled_date', type: 'date', isNullable: false },
          { name: 'completed_date', type: 'date', isNullable: true },
          {
            name: 'status',
            type: 'enum',
            enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
            default: "'scheduled'",
            isNullable: false,
          },
          { name: 'cost', type: 'decimal', precision: 10, scale: 2, isNullable: true },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'findings', type: 'text', isNullable: true },
          { name: 'next_maintenance_date', type: 'date', isNullable: true },
          { name: 'document_urls', type: 'jsonb', isNullable: true },
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
            columnNames: ['asset_id'],
            referencedTableName: 'assets',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'asset_maintenance_logs',
      new TableIndex({ name: 'IDX_aml_society_id', columnNames: ['society_id'] }),
    );
    await queryRunner.createIndex(
      'asset_maintenance_logs',
      new TableIndex({ name: 'IDX_aml_society_asset', columnNames: ['society_id', 'asset_id'] }),
    );
    await queryRunner.createIndex(
      'asset_maintenance_logs',
      new TableIndex({ name: 'IDX_aml_society_status', columnNames: ['society_id', 'status'] }),
    );
    await queryRunner.createIndex(
      'asset_maintenance_logs',
      new TableIndex({ name: 'IDX_aml_scheduled_date', columnNames: ['society_id', 'scheduled_date'] }),
    );

    // ─── 3. asset_maintenance_schedules ─────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'asset_maintenance_schedules',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'society_id', type: 'uuid', isNullable: false },
          { name: 'asset_id', type: 'uuid', isNullable: false },
          {
            name: 'frequency',
            type: 'enum',
            enum: ['weekly', 'monthly', 'quarterly', 'half_yearly', 'annual'],
            isNullable: false,
          },
          { name: 'last_performed_at', type: 'date', isNullable: true },
          { name: 'next_due_date', type: 'date', isNullable: false },
          { name: 'is_active', type: 'boolean', default: true, isNullable: false },
          { name: 'notes', type: 'text', isNullable: true },
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
            columnNames: ['asset_id'],
            referencedTableName: 'assets',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'asset_maintenance_schedules',
      new TableIndex({ name: 'IDX_ams_society_id', columnNames: ['society_id'] }),
    );
    await queryRunner.createIndex(
      'asset_maintenance_schedules',
      new TableIndex({ name: 'IDX_ams_society_asset', columnNames: ['society_id', 'asset_id'] }),
    );
    await queryRunner.createIndex(
      'asset_maintenance_schedules',
      new TableIndex({
        name: 'IDX_ams_next_due',
        columnNames: ['society_id', 'next_due_date', 'is_active'],
      }),
    );

    // ─── 4. asset_depreciation_logs ─────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'asset_depreciation_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'society_id', type: 'uuid', isNullable: false },
          { name: 'asset_id', type: 'uuid', isNullable: false },
          { name: 'depreciation_date', type: 'date', isNullable: false },
          {
            name: 'depreciation_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'book_value_after',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'method',
            type: 'enum',
            enum: ['straight_line', 'declining_balance'],
            default: "'straight_line'",
            isNullable: false,
          },
          { name: 'notes', type: 'text', isNullable: true },
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
            columnNames: ['asset_id'],
            referencedTableName: 'assets',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'asset_depreciation_logs',
      new TableIndex({ name: 'IDX_adl_society_id', columnNames: ['society_id'] }),
    );
    await queryRunner.createIndex(
      'asset_depreciation_logs',
      new TableIndex({ name: 'IDX_adl_society_asset', columnNames: ['society_id', 'asset_id'] }),
    );
    await queryRunner.createIndex(
      'asset_depreciation_logs',
      new TableIndex({ name: 'IDX_adl_depreciation_date', columnNames: ['society_id', 'depreciation_date'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('asset_depreciation_logs', true);
    await queryRunner.dropTable('asset_maintenance_schedules', true);
    await queryRunner.dropTable('asset_maintenance_logs', true);
    await queryRunner.dropTable('assets', true);
  }
}
