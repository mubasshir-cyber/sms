import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Migration: CreateNotifications
 * Creates: notifications
 * Depends on: societies (1724000000005), users (1724000000001)
 */
export class CreateNotifications1724000000011 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'notifications',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'society_id', type: 'uuid', isNullable: true },
          { name: 'user_id', type: 'uuid', isNullable: false },
          {
            name: 'type',
            type: 'enum',
            enum: [
              'invoice_generated',
              'payment_received',
              'payment_overdue',
              'receipt_sent',
              'complaint_raised',
              'complaint_assigned',
              'complaint_status_update',
              'complaint_escalated',
              'announcement',
              'general',
            ],
            isNullable: false,
          },
          {
            name: 'channel',
            type: 'enum',
            enum: ['in_app', 'email', 'sms'],
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'sent', 'failed'],
            default: "'pending'",
            isNullable: false,
          },
          { name: 'subject', type: 'varchar', length: '255', isNullable: true },
          { name: 'body', type: 'text', isNullable: false },
          { name: 'payload', type: 'jsonb', isNullable: true, default: "'{}'" },
          { name: 'sent_at', type: 'timestamp', isNullable: true },
          { name: 'read_at', type: 'timestamp', isNullable: true },
          { name: 'error_message', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'notifications',
      new TableIndex({ name: 'IDX_notif_society_id', columnNames: ['society_id'] }),
    );

    await queryRunner.createIndex(
      'notifications',
      new TableIndex({ name: 'IDX_notif_user_id', columnNames: ['user_id'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('notifications', true);
  }
}
