import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Migration: CreateSocieties
 * Creates: societies
 * Depends on: tenants (1724000000004)
 */
export class CreateSocieties1724000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'societies',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'tenant_id', type: 'uuid', isNullable: false },
          { name: 'name', type: 'varchar', length: '200', isNullable: false },
          { name: 'slug', type: 'varchar', length: '150', isNullable: false, isUnique: true },
          { name: 'address', type: 'jsonb', isNullable: true },
          { name: 'registration_no', type: 'varchar', length: '100', isNullable: true },
          { name: 'gst_no', type: 'varchar', length: '20', isNullable: true },
          { name: 'logo_url', type: 'varchar', isNullable: true },
          { name: 'timezone', type: 'varchar', length: '100', default: "'Asia/Kolkata'" },
          { name: 'contact_email', type: 'varchar', length: '255', isNullable: true },
          { name: 'contact_phone', type: 'varchar', length: '20', isNullable: true },
          { name: 'total_towers', type: 'int', default: 0 },
          { name: 'total_units', type: 'int', default: 0 },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'settings', type: 'jsonb', isNullable: true, default: "'{}'" },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'societies',
      new TableIndex({ name: 'IDX_societies_tenant_id', columnNames: ['tenant_id'] }),
    );
    await queryRunner.createIndex(
      'societies',
      new TableIndex({ name: 'IDX_societies_slug', columnNames: ['slug'], isUnique: true }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('societies', true);
  }
}
