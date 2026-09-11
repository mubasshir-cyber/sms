import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Migration: CreateVehiclesAndParking
 * Creates: parking_slots, vehicles, parking_allocations, parking_transfers
 * Depends on: societies (1724000000005), units (1724000000006), users (1724000000001)
 */
export class CreateVehiclesAndParking1724000000016 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── 1. parking_slots ────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'parking_slots',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'society_id', type: 'uuid', isNullable: false },
          { name: 'tower_id', type: 'uuid', isNullable: true },
          { name: 'slot_number', type: 'varchar', length: '50', isNullable: false },
          { name: 'floor', type: 'varchar', length: '50', isNullable: true },
          {
            name: 'slot_type',
            type: 'enum',
            enum: ['covered', 'open', 'basement', 'stilt', 'ev_charging'],
            default: "'open'",
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['available', 'allocated', 'blocked', 'maintenance'],
            default: "'available'",
            isNullable: false,
          },
          { name: 'is_visitor_slot', type: 'boolean', default: false, isNullable: false },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'parking_slots',
      new TableIndex({
        name: 'IDX_parking_slots_society_slot_number',
        columnNames: ['society_id', 'slot_number'],
      }),
    );
    await queryRunner.createIndex(
      'parking_slots',
      new TableIndex({
        name: 'IDX_parking_slots_society_status',
        columnNames: ['society_id', 'status'],
      }),
    );
    await queryRunner.createIndex(
      'parking_slots',
      new TableIndex({
        name: 'IDX_parking_slots_society_visitor',
        columnNames: ['society_id', 'is_visitor_slot'],
      }),
    );

    // ─── 2. vehicles ─────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'vehicles',
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
          { name: 'user_id', type: 'uuid', isNullable: false },
          {
            name: 'vehicle_type',
            type: 'enum',
            enum: ['car', 'bike', 'bicycle', 'ev_car', 'ev_bike', 'other'],
            default: "'car'",
            isNullable: false,
          },
          { name: 'registration_number', type: 'varchar', length: '50', isNullable: false },
          { name: 'make_model', type: 'varchar', length: '150', isNullable: true },
          { name: 'color', type: 'varchar', length: '50', isNullable: true },
          { name: 'rfid_tag', type: 'varchar', length: '100', isNullable: true },
          { name: 'fastag_number', type: 'varchar', length: '100', isNullable: true },
          { name: 'rc_document_url', type: 'varchar', length: '500', isNullable: true },
          { name: 'insurance_document_url', type: 'varchar', length: '500', isNullable: true },
          { name: 'insurance_expiry_date', type: 'date', isNullable: true },
          {
            name: 'verification_status',
            type: 'enum',
            enum: ['pending', 'verified', 'rejected'],
            default: "'pending'",
            isNullable: false,
          },
          { name: 'verified_by_user_id', type: 'uuid', isNullable: true },
          { name: 'verified_at', type: 'timestamp', isNullable: true },
          { name: 'rejection_reason', type: 'text', isNullable: true },
          { name: 'is_active', type: 'boolean', default: true, isNullable: false },
          { name: 'parking_slot_id', type: 'uuid', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'vehicles',
      new TableIndex({
        name: 'IDX_vehicles_society_reg_number',
        columnNames: ['society_id', 'registration_number'],
      }),
    );
    await queryRunner.createIndex(
      'vehicles',
      new TableIndex({
        name: 'IDX_vehicles_society_rfid',
        columnNames: ['society_id', 'rfid_tag'],
      }),
    );
    await queryRunner.createIndex(
      'vehicles',
      new TableIndex({
        name: 'IDX_vehicles_unit_id',
        columnNames: ['unit_id'],
      }),
    );
    await queryRunner.createIndex(
      'vehicles',
      new TableIndex({
        name: 'IDX_vehicles_user_id',
        columnNames: ['user_id'],
      }),
    );

    // ─── 3. parking_allocations ──────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'parking_allocations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'society_id', type: 'uuid', isNullable: false },
          { name: 'slot_id', type: 'uuid', isNullable: false },
          { name: 'unit_id', type: 'uuid', isNullable: false },
          { name: 'resident_id', type: 'uuid', isNullable: true },
          { name: 'vehicle_id', type: 'uuid', isNullable: true },
          {
            name: 'allocation_type',
            type: 'enum',
            enum: ['primary', 'additional', 'temporary', 'visitor'],
            default: "'primary'",
            isNullable: false,
          },
          { name: 'start_date', type: 'date', isNullable: false },
          { name: 'end_date', type: 'date', isNullable: true },
          { name: 'monthly_fee', type: 'decimal', precision: 10, scale: 2, default: '0.00', isNullable: false },
          { name: 'is_active', type: 'boolean', default: true, isNullable: false },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'parking_allocations',
      new TableIndex({
        name: 'IDX_parking_allocations_society_slot',
        columnNames: ['society_id', 'slot_id'],
      }),
    );
    await queryRunner.createIndex(
      'parking_allocations',
      new TableIndex({
        name: 'IDX_parking_allocations_society_unit',
        columnNames: ['society_id', 'unit_id'],
      }),
    );

    // ─── 4. parking_transfers ────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'parking_transfers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'society_id', type: 'uuid', isNullable: false },
          { name: 'slot_id', type: 'uuid', isNullable: false },
          { name: 'from_unit_id', type: 'uuid', isNullable: false },
          { name: 'to_unit_id', type: 'uuid', isNullable: false },
          { name: 'requested_by_user_id', type: 'uuid', isNullable: false },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'approved', 'rejected', 'cancelled'],
            default: "'pending'",
            isNullable: false,
          },
          { name: 'reason', type: 'text', isNullable: false },
          { name: 'admin_notes', type: 'text', isNullable: true },
          { name: 'approved_by_user_id', type: 'uuid', isNullable: true },
          { name: 'approved_at', type: 'timestamp', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'parking_transfers',
      new TableIndex({
        name: 'IDX_parking_transfers_society_status',
        columnNames: ['society_id', 'status'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('parking_transfers', true);
    await queryRunner.dropTable('parking_allocations', true);
    await queryRunner.dropTable('vehicles', true);
    await queryRunner.dropTable('parking_slots', true);
  }
}
