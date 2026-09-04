import { MigrationInterface, QueryRunner, Table, TableIndex, TableUnique } from 'typeorm';

/**
 * Migration: CreateResidents
 * Creates: residents, family_members
 * Depends on: societies (1724000000005), units (1724000000006)
 */
export class CreateResidents1724000000007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── residents ────────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'residents',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'society_id', type: 'uuid', isNullable: false },
          { name: 'user_id', type: 'uuid', isNullable: false },
          { name: 'unit_id', type: 'uuid', isNullable: false },
          {
            name: 'type',
            type: 'enum',
            enum: ['owner', 'tenant'],
            default: "'owner'",
          },
          { name: 'move_in_date', type: 'date', isNullable: true },
          { name: 'move_out_date', type: 'date', isNullable: true },
          { name: 'lease_start_date', type: 'date', isNullable: true },
          { name: 'lease_end_date', type: 'date', isNullable: true },
          { name: 'emergency_contact_name', type: 'varchar', length: '150', isNullable: true },
          { name: 'emergency_contact_phone', type: 'varchar', length: '20', isNullable: true },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
        uniques: [
          new TableUnique({
            name: 'UQ_residents_user_society',
            columnNames: ['user_id', 'society_id'],
          }),
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'residents',
      new TableIndex({ name: 'IDX_residents_society_id', columnNames: ['society_id'] }),
    );
    await queryRunner.createIndex(
      'residents',
      new TableIndex({ name: 'IDX_residents_user_id', columnNames: ['user_id'] }),
    );
    await queryRunner.createIndex(
      'residents',
      new TableIndex({ name: 'IDX_residents_unit_id', columnNames: ['unit_id'] }),
    );

    // ─── family_members ───────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'family_members',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'resident_id', type: 'uuid', isNullable: false },
          { name: 'society_id', type: 'uuid', isNullable: false },
          { name: 'name', type: 'varchar', length: '150', isNullable: false },
          { name: 'relationship', type: 'varchar', length: '50', isNullable: false },
          { name: 'phone', type: 'varchar', length: '20', isNullable: true },
          { name: 'email', type: 'varchar', length: '255', isNullable: true },
          { name: 'date_of_birth', type: 'date', isNullable: true },
          { name: 'is_emergency_contact', type: 'boolean', default: false },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'family_members',
      new TableIndex({ name: 'IDX_family_resident_id', columnNames: ['resident_id'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('family_members', true);
    await queryRunner.dropTable('residents', true);
  }
}
