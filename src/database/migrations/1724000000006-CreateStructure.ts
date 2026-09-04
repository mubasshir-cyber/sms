import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Migration: CreateStructure
 * Creates: towers, floors, units (in dependency order)
 * Depends on: societies (1724000000005)
 */
export class CreateStructure1724000000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── towers ───────────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'towers',
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
          { name: 'total_floors', type: 'int', default: 0 },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'towers',
      new TableIndex({ name: 'IDX_towers_society_id', columnNames: ['society_id'] }),
    );

    // ─── floors ───────────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'floors',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'society_id', type: 'uuid', isNullable: false },
          { name: 'tower_id', type: 'uuid', isNullable: false },
          { name: 'floor_number', type: 'int', isNullable: false },
          { name: 'display_name', type: 'varchar', length: '50', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'floors',
      new TableIndex({ name: 'IDX_floors_society_id', columnNames: ['society_id'] }),
    );
    await queryRunner.createIndex(
      'floors',
      new TableIndex({ name: 'IDX_floors_tower_id', columnNames: ['tower_id'] }),
    );

    // ─── units ────────────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'units',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'society_id', type: 'uuid', isNullable: false },
          { name: 'tower_id', type: 'uuid', isNullable: false },
          { name: 'floor_id', type: 'uuid', isNullable: false },
          { name: 'unit_number', type: 'varchar', length: '20', isNullable: false },
          {
            name: 'type',
            type: 'enum',
            enum: ['studio', '1bhk', '2bhk', '3bhk', '4bhk', 'penthouse', 'shop', 'office', 'commercial'],
            default: "'2bhk'",
          },
          { name: 'sq_ft', type: 'decimal', precision: 8, scale: 2, isNullable: true },
          { name: 'bedrooms', type: 'int', isNullable: true },
          { name: 'bathrooms', type: 'int', isNullable: true },
          {
            name: 'status',
            type: 'enum',
            enum: ['vacant', 'occupied', 'under_renovation', 'locked'],
            default: "'vacant'",
          },
          { name: 'owner_user_id', type: 'uuid', isNullable: true },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'units',
      new TableIndex({ name: 'IDX_units_society_id', columnNames: ['society_id'] }),
    );
    await queryRunner.createIndex(
      'units',
      new TableIndex({ name: 'IDX_units_tower_id', columnNames: ['tower_id'] }),
    );
    await queryRunner.createIndex(
      'units',
      new TableIndex({ name: 'IDX_units_floor_id', columnNames: ['floor_id'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('units', true);
    await queryRunner.dropTable('floors', true);
    await queryRunner.dropTable('towers', true);
  }
}
