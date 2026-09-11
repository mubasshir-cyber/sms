import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Migration: CreateVendors
 * Creates: vendors, vendor_contracts, vendor_amc_schedules, vendor_invoices, vendor_reviews
 * Depends on: societies (1724000000005), users (1724000000001)
 */
export class CreateVendors1724000000018 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── 1. vendors ─────────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'vendors',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'society_id', type: 'uuid', isNullable: false },
          { name: 'name', type: 'varchar', length: '200', isNullable: false },
          {
            name: 'category',
            type: 'enum',
            enum: [
              'lift_amc',
              'cctv_security',
              'cleaning_housekeeping',
              'electrical',
              'plumbing',
              'gardening_landscaping',
              'pest_control',
              'fire_safety',
              'internet_cable',
              'waste_management',
              'swimming_pool',
              'other',
            ],
            default: "'other'",
            isNullable: false,
          },
          { name: 'contact_person', type: 'varchar', length: '150', isNullable: false },
          { name: 'email', type: 'varchar', length: '255', isNullable: false },
          { name: 'phone', type: 'varchar', length: '20', isNullable: false },
          { name: 'alternate_phone', type: 'varchar', length: '20', isNullable: true },
          { name: 'address', type: 'text', isNullable: true },
          { name: 'gstin', type: 'varchar', length: '20', isNullable: true },
          { name: 'pan', type: 'varchar', length: '15', isNullable: true },
          { name: 'bank_details', type: 'jsonb', isNullable: true },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'inactive', 'blacklisted'],
            default: "'active'",
            isNullable: false,
          },
          { name: 'rating', type: 'decimal', precision: 3, scale: 2, default: '0.00', isNullable: false },
          { name: 'rating_count', type: 'int', default: 0, isNullable: false },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'user_id', type: 'uuid', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
        foreignKeys: [
          {
            columnNames: ['society_id'],
            referencedTableName: 'societies',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndices('vendors', [
      new TableIndex({ name: 'IDX_vendors_society_id', columnNames: ['society_id'] }),
      new TableIndex({ name: 'IDX_vendors_society_status', columnNames: ['society_id', 'status'] }),
      new TableIndex({ name: 'IDX_vendors_society_category', columnNames: ['society_id', 'category'] }),
    ]);

    // ─── 2. vendor_contracts ────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'vendor_contracts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'society_id', type: 'uuid', isNullable: false },
          { name: 'vendor_id', type: 'uuid', isNullable: false },
          { name: 'contract_number', type: 'varchar', length: '50', isNullable: false },
          { name: 'title', type: 'varchar', length: '255', isNullable: false },
          {
            name: 'service_category',
            type: 'enum',
            enum: [
              'lift_amc',
              'cctv_security',
              'cleaning_housekeeping',
              'electrical',
              'plumbing',
              'gardening_landscaping',
              'pest_control',
              'fire_safety',
              'internet_cable',
              'waste_management',
              'swimming_pool',
              'other',
            ],
            isNullable: false,
          },
          { name: 'start_date', type: 'date', isNullable: false },
          { name: 'end_date', type: 'date', isNullable: false },
          { name: 'contract_value', type: 'decimal', precision: 10, scale: 2, isNullable: false },
          {
            name: 'billing_frequency',
            type: 'enum',
            enum: ['monthly', 'quarterly', 'half_yearly', 'annual', 'one_time'],
            default: "'monthly'",
            isNullable: false,
          },
          { name: 'payment_terms_days', type: 'int', default: 30, isNullable: false },
          { name: 'terms_and_conditions', type: 'text', isNullable: true },
          { name: 'sla_details', type: 'text', isNullable: true },
          { name: 'document_urls', type: 'jsonb', isNullable: true },
          {
            name: 'status',
            type: 'enum',
            enum: ['draft', 'active', 'expired', 'terminated'],
            default: "'active'",
            isNullable: false,
          },
          { name: 'renewal_reminder_days', type: 'jsonb', default: "'[30, 15, 7]'", isNullable: false },
          { name: 'last_expiry_alert_sent_at', type: 'timestamp', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
        foreignKeys: [
          {
            columnNames: ['society_id'],
            referencedTableName: 'societies',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['vendor_id'],
            referencedTableName: 'vendors',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndices('vendor_contracts', [
      new TableIndex({ name: 'IDX_vendor_contracts_society_id', columnNames: ['society_id'] }),
      new TableIndex({ name: 'IDX_vendor_contracts_society_vendor', columnNames: ['society_id', 'vendor_id'] }),
      new TableIndex({ name: 'IDX_vendor_contracts_status', columnNames: ['society_id', 'status'] }),
      new TableIndex({ name: 'IDX_vendor_contracts_dates', columnNames: ['society_id', 'start_date', 'end_date'] }),
    ]);

    // ─── 3. vendor_amc_schedules ────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'vendor_amc_schedules',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'society_id', type: 'uuid', isNullable: false },
          { name: 'contract_id', type: 'uuid', isNullable: false },
          { name: 'vendor_id', type: 'uuid', isNullable: false },
          { name: 'scheduled_date', type: 'date', isNullable: false },
          { name: 'service_type', type: 'varchar', length: '255', isNullable: false },
          {
            name: 'status',
            type: 'enum',
            enum: ['scheduled', 'in_progress', 'completed', 'missed', 'cancelled'],
            default: "'scheduled'",
            isNullable: false,
          },
          { name: 'completed_at', type: 'timestamp', isNullable: true },
          { name: 'technician_name', type: 'varchar', length: '150', isNullable: true },
          { name: 'technician_phone', type: 'varchar', length: '20', isNullable: true },
          { name: 'service_report_url', type: 'varchar', length: '500', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
        foreignKeys: [
          {
            columnNames: ['society_id'],
            referencedTableName: 'societies',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['contract_id'],
            referencedTableName: 'vendor_contracts',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['vendor_id'],
            referencedTableName: 'vendors',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndices('vendor_amc_schedules', [
      new TableIndex({ name: 'IDX_amc_schedules_society_id', columnNames: ['society_id'] }),
      new TableIndex({ name: 'IDX_amc_schedules_contract', columnNames: ['society_id', 'contract_id'] }),
      new TableIndex({ name: 'IDX_amc_schedules_scheduled_date', columnNames: ['society_id', 'scheduled_date'] }),
    ]);

    // ─── 4. vendor_invoices ─────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'vendor_invoices',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'society_id', type: 'uuid', isNullable: false },
          { name: 'vendor_id', type: 'uuid', isNullable: false },
          { name: 'contract_id', type: 'uuid', isNullable: true },
          { name: 'invoice_number', type: 'varchar', length: '100', isNullable: false },
          { name: 'invoice_date', type: 'date', isNullable: false },
          { name: 'due_date', type: 'date', isNullable: false },
          { name: 'amount', type: 'decimal', precision: 10, scale: 2, isNullable: false },
          { name: 'tax_amount', type: 'decimal', precision: 10, scale: 2, default: '0.00', isNullable: false },
          { name: 'total_amount', type: 'decimal', precision: 10, scale: 2, isNullable: false },
          {
            name: 'payment_status',
            type: 'enum',
            enum: ['pending_approval', 'approved', 'paid', 'partially_paid', 'rejected'],
            default: "'pending_approval'",
            isNullable: false,
          },
          { name: 'paid_amount', type: 'decimal', precision: 10, scale: 2, default: '0.00', isNullable: false },
          { name: 'payment_reference', type: 'varchar', length: '100', isNullable: true },
          { name: 'paid_at', type: 'timestamp', isNullable: true },
          { name: 'expense_id', type: 'uuid', isNullable: true },
          { name: 'invoice_pdf_url', type: 'varchar', length: '500', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'approved_by_user_id', type: 'uuid', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
        foreignKeys: [
          {
            columnNames: ['society_id'],
            referencedTableName: 'societies',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['vendor_id'],
            referencedTableName: 'vendors',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['contract_id'],
            referencedTableName: 'vendor_contracts',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
          {
            columnNames: ['approved_by_user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndices('vendor_invoices', [
      new TableIndex({ name: 'IDX_vendor_invoices_society_id', columnNames: ['society_id'] }),
      new TableIndex({ name: 'IDX_vendor_invoices_society_vendor', columnNames: ['society_id', 'vendor_id'] }),
      new TableIndex({ name: 'IDX_vendor_invoices_payment_status', columnNames: ['society_id', 'payment_status'] }),
      new TableIndex({ name: 'IDX_vendor_invoices_due_date', columnNames: ['society_id', 'due_date'] }),
    ]);

    // ─── 5. vendor_reviews ──────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'vendor_reviews',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'society_id', type: 'uuid', isNullable: false },
          { name: 'vendor_id', type: 'uuid', isNullable: false },
          { name: 'contract_id', type: 'uuid', isNullable: true },
          { name: 'rating', type: 'int', isNullable: false },
          { name: 'review', type: 'text', isNullable: true },
          { name: 'reviewed_by_user_id', type: 'uuid', isNullable: false },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
        foreignKeys: [
          {
            columnNames: ['society_id'],
            referencedTableName: 'societies',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['vendor_id'],
            referencedTableName: 'vendors',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['reviewed_by_user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndices('vendor_reviews', [
      new TableIndex({ name: 'IDX_vendor_reviews_society_id', columnNames: ['society_id'] }),
      new TableIndex({ name: 'IDX_vendor_reviews_society_vendor', columnNames: ['society_id', 'vendor_id'] }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('vendor_reviews', true);
    await queryRunner.dropTable('vendor_invoices', true);
    await queryRunner.dropTable('vendor_amc_schedules', true);
    await queryRunner.dropTable('vendor_contracts', true);
    await queryRunner.dropTable('vendors', true);
  }
}
