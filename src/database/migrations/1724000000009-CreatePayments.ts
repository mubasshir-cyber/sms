import { MigrationInterface, QueryRunner, Table, TableIndex, TableUnique } from 'typeorm';

/**
 * Migration: CreatePayments
 * Creates: payments
 * Depends on: societies (1724000000005), invoices (1724000000008), units (1724000000006)
 */
export class CreatePayments1724000000009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'payments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'society_id', type: 'uuid', isNullable: false },
          { name: 'invoice_id', type: 'uuid', isNullable: false },
          { name: 'unit_id', type: 'uuid', isNullable: false },
          { name: 'amount', type: 'decimal', precision: 10, scale: 2, isNullable: false },
          {
            name: 'method',
            type: 'enum',
            enum: ['upi', 'card', 'netbanking', 'cash', 'cheque', 'bank_transfer'],
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'success', 'failed', 'refunded'],
            default: "'pending'",
            isNullable: false,
          },
          { name: 'gateway_order_id', type: 'varchar', isNullable: true },
          { name: 'gateway_payment_id', type: 'varchar', isNullable: true },
          { name: 'gateway_signature', type: 'varchar', isNullable: true },
          { name: 'cheque_no', type: 'varchar', isNullable: true },
          { name: 'bank_name', type: 'varchar', isNullable: true },
          { name: 'paid_at', type: 'timestamp', isNullable: true },
          { name: 'receipt_number', type: 'varchar', isNullable: true, isUnique: true },
          { name: 'receipt_url', type: 'varchar', isNullable: true },
          { name: 'recorded_by_user_id', type: 'uuid', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'payments',
      new TableIndex({ name: 'IDX_payment_society_id', columnNames: ['society_id'] }),
    );

    await queryRunner.createIndex(
      'payments',
      new TableIndex({ name: 'IDX_payment_invoice_id', columnNames: ['invoice_id'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('payments', true);
  }
}
