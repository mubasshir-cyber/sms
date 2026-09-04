import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Migration: CreateTenants
 * Creates: tenants
 */
export class CreateTenants1724000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tenants',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'name', type: 'varchar', length: '200', isNullable: false },
          { name: 'slug', type: 'varchar', length: '100', isNullable: false, isUnique: true },
          { name: 'contact_name', type: 'varchar', length: '150', isNullable: false },
          { name: 'contact_email', type: 'varchar', length: '255', isNullable: false, isUnique: true },
          { name: 'contact_phone', type: 'varchar', length: '20', isNullable: true },
          {
            name: 'plan',
            type: 'enum',
            enum: ['free', 'basic', 'premium', 'enterprise'],
            default: "'free'",
          },
          { name: 'max_societies', type: 'int', default: 1 },
          { name: 'plan_expires_at', type: 'timestamp', isNullable: true },
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
      'tenants',
      new TableIndex({ name: 'IDX_tenants_slug', columnNames: ['slug'], isUnique: true }),
    );
    await queryRunner.createIndex(
      'tenants',
      new TableIndex({ name: 'IDX_tenants_contact_email', columnNames: ['contact_email'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('tenants', true);
  }
}
