import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Migration: CreateFacilitiesAndBookings
 * Creates: facilities, facility_bookings, facility_booking_status_history
 * Depends on: societies (1724000000005), units (1724000000006), users (1724000000001)
 */
export class CreateFacilitiesAndBookings1724000000017 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── 1. facilities ──────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'facilities',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'society_id', type: 'uuid', isNullable: false },
          { name: 'name', type: 'varchar', length: '150', isNullable: false },
          {
            name: 'facility_type',
            type: 'enum',
            enum: [
              'clubhouse', 'swimming_pool', 'gym', 'party_hall', 'tennis_court',
              'badminton_court', 'community_hall', 'rooftop', 'bbq_area', 'guest_room', 'other',
            ],
            default: "'other'",
            isNullable: false,
          },
          {
            name: 'capacity_type',
            type: 'enum',
            enum: ['exclusive', 'shared'],
            default: "'exclusive'",
            isNullable: false,
          },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'location', type: 'varchar', length: '150', isNullable: true },
          { name: 'capacity', type: 'int', default: 1, isNullable: false },
          { name: 'rules', type: 'text', isNullable: true },
          {
            name: 'image_urls',
            type: 'varchar',
            isArray: true,
            default: "'{}'",
            isNullable: true,
          },
          {
            name: 'booking_slot_type',
            type: 'enum',
            enum: ['hourly', 'fixed_slot', 'full_day', 'custom'],
            default: "'hourly'",
            isNullable: false,
          },
          { name: 'slot_duration_minutes', type: 'int', default: 60, isNullable: false },
          { name: 'open_time', type: 'varchar', length: '10', default: "'06:00'", isNullable: false },
          { name: 'close_time', type: 'varchar', length: '10', default: "'22:00'", isNullable: false },
          { name: 'booking_fee', type: 'decimal', precision: 10, scale: 2, default: '0.00', isNullable: false },
          { name: 'deposit_fee', type: 'decimal', precision: 10, scale: 2, default: '0.00', isNullable: false },
          { name: 'requires_approval', type: 'boolean', default: false, isNullable: false },
          { name: 'max_bookings_per_month_per_unit', type: 'int', default: 4, isNullable: false },
          { name: 'advance_booking_days_limit', type: 'int', default: 30, isNullable: false },
          { name: 'cancellation_hours_before', type: 'int', default: 24, isNullable: false },
          { name: 'is_active', type: 'boolean', default: true, isNullable: false },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'facilities',
      new TableIndex({
        name: 'IDX_facilities_society_is_active',
        columnNames: ['society_id', 'is_active'],
      }),
    );
    await queryRunner.createIndex(
      'facilities',
      new TableIndex({
        name: 'IDX_facilities_society_name',
        columnNames: ['society_id', 'name'],
      }),
    );

    // ─── 2. facility_bookings ───────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'facility_bookings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'society_id', type: 'uuid', isNullable: false },
          { name: 'facility_id', type: 'uuid', isNullable: false },
          { name: 'unit_id', type: 'uuid', isNullable: false },
          { name: 'user_id', type: 'uuid', isNullable: false },
          { name: 'booking_date', type: 'date', isNullable: false },
          { name: 'start_time', type: 'varchar', length: '10', isNullable: false },
          { name: 'end_time', type: 'varchar', length: '10', isNullable: false },
          { name: 'attendees_count', type: 'int', default: 1, isNullable: false },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending_approval', 'confirmed', 'rejected', 'cancelled', 'completed'],
            default: "'pending_approval'",
            isNullable: false,
          },
          { name: 'total_fee', type: 'decimal', precision: 10, scale: 2, default: '0.00', isNullable: false },
          { name: 'deposit_fee', type: 'decimal', precision: 10, scale: 2, default: '0.00', isNullable: false },
          { name: 'purpose', type: 'text', isNullable: true },
          { name: 'approved_by_user_id', type: 'uuid', isNullable: true },
          { name: 'approved_at', type: 'timestamp', isNullable: true },
          { name: 'rejection_reason', type: 'text', isNullable: true },
          { name: 'cancellation_reason', type: 'text', isNullable: true },
          { name: 'cancelled_at', type: 'timestamp', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'facility_bookings',
      new TableIndex({
        name: 'IDX_facility_bookings_facility_date_status',
        columnNames: ['facility_id', 'booking_date', 'status'],
      }),
    );
    await queryRunner.createIndex(
      'facility_bookings',
      new TableIndex({
        name: 'IDX_facility_bookings_society_status',
        columnNames: ['society_id', 'status'],
      }),
    );
    await queryRunner.createIndex(
      'facility_bookings',
      new TableIndex({
        name: 'IDX_facility_bookings_unit_id',
        columnNames: ['unit_id'],
      }),
    );
    await queryRunner.createIndex(
      'facility_bookings',
      new TableIndex({
        name: 'IDX_facility_bookings_user_id',
        columnNames: ['user_id'],
      }),
    );

    // ─── 3. facility_booking_status_history ─────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'facility_booking_status_history',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'society_id', type: 'uuid', isNullable: false },
          { name: 'booking_id', type: 'uuid', isNullable: false },
          { name: 'old_status', type: 'varchar', length: '50', isNullable: true },
          { name: 'new_status', type: 'varchar', length: '50', isNullable: false },
          { name: 'changed_by_user_id', type: 'uuid', isNullable: false },
          { name: 'reason', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'facility_booking_status_history',
      new TableIndex({
        name: 'IDX_facility_history_booking_id',
        columnNames: ['booking_id'],
      }),
    );
    await queryRunner.createIndex(
      'facility_booking_status_history',
      new TableIndex({
        name: 'IDX_facility_history_society_id',
        columnNames: ['society_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('facility_booking_status_history', true);
    await queryRunner.dropTable('facility_bookings', true);
    await queryRunner.dropTable('facilities', true);
  }
}
