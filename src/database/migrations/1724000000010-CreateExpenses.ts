import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Migration: CreateExpenses
 * Creates: expense_categories, expenses, bank_accounts
 * Depends on: societies (1724000000005)
 */
export class CreateExpenses1724000000010 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── expense_categories ───────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'expense_categories',
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
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'expense_categories',
      new TableIndex({ name: 'IDX_expcat_society_id', columnNames: ['society_id'] }),
    );

    // ─── expenses ─────────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'expenses',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'society_id', type: 'uuid', isNullable: false },
          { name: 'category_id', type: 'uuid', isNullable: false },
          { name: 'amount', type: 'decimal', precision: 10, scale: 2, isNullable: false },
          { name: 'expense_date', type: 'date', isNullable: false },
          { name: 'description', type: 'text', isNullable: false },
          { name: 'vendor_name', type: 'varchar', length: '150', isNullable: true },
          { name: 'invoice_no', type: 'varchar', length: '50', isNullable: true },
          { name: 'receipt_url', type: 'varchar', isNullable: true },
          { name: 'added_by_user_id', type: 'uuid', isNullable: false },
          { name: 'approved_by_user_id', type: 'uuid', isNullable: true },
          { name: 'is_approved', type: 'boolean', default: false },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'expenses',
      new TableIndex({ name: 'IDX_expense_society_id', columnNames: ['society_id'] }),
    );

    // ─── bank_accounts ────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'bank_accounts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'society_id', type: 'uuid', isNullable: false },
          { name: 'bank_name', type: 'varchar', length: '100', isNullable: false },
          { name: 'account_number', type: 'varchar', length: '30', isNullable: false },
          { name: 'ifsc_code', type: 'varchar', length: '20', isNullable: false },
          {
            name: 'account_type',
            type: 'varchar',
            length: '20',
            default: "'savings'",
            isNullable: false,
          },
          {
            name: 'opening_balance',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'current_balance',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          { name: 'is_primary', type: 'boolean', default: false },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'bank_accounts',
      new TableIndex({ name: 'IDX_bankacct_society_id', columnNames: ['society_id'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('bank_accounts', true);
    await queryRunner.dropTable('expenses', true);
    await queryRunner.dropTable('expense_categories', true);
  }
}
