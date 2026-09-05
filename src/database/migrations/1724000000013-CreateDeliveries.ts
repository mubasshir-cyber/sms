import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Migration: CreateDeliveries
 * Creates: deliveries
 * Depends on: societies (1724000000005), units (1724000000006), users (1724000000001), gates (1724000000012)
 */
export class CreateDeliveries1724000000013 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'deliveries',
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
          { name: 'recipient_user_id', type: 'uuid', isNullable: true },
          { name: 'gate_id', type: 'uuid', isNullable: false },
          { name: 'logged_by_guard_id', type: 'uuid', isNullable: false },
          {
            name: 'delivery_type',
            type: 'enum',
            enum: ['courier', 'food', 'ecommerce', 'grocery', 'documents', 'medicine', 'other'],
            default: "'courier'",
            isNullable: false,
          },
          { name: 'company', type: 'varchar', length: '100', isNullable: false },
          { name: 'delivery_person_name', type: 'varchar', length: '100', isNullable: true },
          { name: 'delivery_person_phone', type: 'varchar', length: '20', isNullable: true },
          { name: 'vehicle_number', type: 'varchar', length: '20', isNullable: true },
          { name: 'tracking_number', type: 'varchar', length: '100', isNullable: true },
          { name: 'item_description', type: 'text', isNullable: true },
          { name: 'photo_url', type: 'varchar', length: '500', isNullable: true },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending_pickup', 'delivered_to_unit', 'collected', 'returned', 'cancelled'],
            default: "'pending_pickup'",
            isNullable: false,
          },
          { name: 'pickup_otp', type: 'varchar', length: '10', isNullable: true },
          { name: 'passcode', type: 'varchar', length: '20', isNullable: true },
          { name: 'leave_at_gate', type: 'boolean', default: true },
          { name: 'arrived_at', type: 'timestamp', default: 'now()' },
          { name: 'collected_at', type: 'timestamp', isNullable: true },
          { name: 'collected_by_user_id', type: 'uuid', isNullable: true },
          { name: 'collected_by_guard_id', type: 'uuid', isNullable: true },
          { name: 'handover_photo_url', type: 'varchar', length: '500', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'is_unattended_alert_sent', type: 'boolean', default: false },
          { name: 'unattended_alert_sent_at', type: 'timestamp', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'deliveries',
      new TableIndex({ name: 'IDX_deliveries_society_status', columnNames: ['society_id', 'status'] }),
    );

    await queryRunner.createIndex(
      'deliveries',
      new TableIndex({ name: 'IDX_deliveries_unit_id', columnNames: ['unit_id'] }),
    );

    await queryRunner.createIndex(
      'deliveries',
      new TableIndex({ name: 'IDX_deliveries_gate_id', columnNames: ['gate_id'] }),
    );

    await queryRunner.createIndex(
      'deliveries',
      new TableIndex({ name: 'IDX_deliveries_arrived_at', columnNames: ['arrived_at'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('deliveries', true);
  }
}
