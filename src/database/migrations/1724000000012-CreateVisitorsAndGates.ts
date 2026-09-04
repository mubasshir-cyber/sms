import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Migration: CreateVisitorsAndGates
 * Creates: gates, gate_assignments, visitors, visitor_logs, security_incidents
 * Depends on: societies (1724000000005), units (1724000000006), users (1724000000001)
 */
export class CreateVisitorsAndGates1724000000012 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── 1. gates ─────────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'gates',
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
          {
            name: 'gate_type',
            type: 'enum',
            enum: ['entry_exit', 'entry_only', 'exit_only', 'emergency'],
            default: "'entry_exit'",
            isNullable: false,
          },
          { name: 'location_description', type: 'text', isNullable: true },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'gates',
      new TableIndex({ name: 'IDX_gate_society_id', columnNames: ['society_id'] }),
    );

    // ─── 2. gate_assignments ──────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'gate_assignments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'society_id', type: 'uuid', isNullable: false },
          { name: 'gate_id', type: 'uuid', isNullable: false },
          { name: 'guard_user_id', type: 'uuid', isNullable: false },
          { name: 'shift_name', type: 'varchar', length: '50', isNullable: true },
          { name: 'shift_start', type: 'timestamp', isNullable: false },
          { name: 'shift_end', type: 'timestamp', isNullable: false },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'gate_assignments',
      new TableIndex({ name: 'IDX_gate_assign_society_id', columnNames: ['society_id'] }),
    );
    await queryRunner.createIndex(
      'gate_assignments',
      new TableIndex({ name: 'IDX_gate_assign_gate_id', columnNames: ['gate_id'] }),
    );
    await queryRunner.createIndex(
      'gate_assignments',
      new TableIndex({ name: 'IDX_gate_assign_guard_id', columnNames: ['guard_user_id'] }),
    );

    // ─── 3. visitors ──────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'visitors',
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
          { name: 'host_user_id', type: 'uuid', isNullable: false },
          { name: 'name', type: 'varchar', length: '100', isNullable: false },
          { name: 'phone', type: 'varchar', length: '20', isNullable: false },
          {
            name: 'visitor_type',
            type: 'enum',
            enum: ['guest', 'delivery', 'cab', 'service_provider', 'other'],
            default: "'guest'",
            isNullable: false,
          },
          { name: 'purpose', type: 'varchar', length: '255', isNullable: true },
          { name: 'vehicle_number', type: 'varchar', length: '30', isNullable: true },
          { name: 'photo_url', type: 'varchar', isNullable: true },
          { name: 'passcode', type: 'varchar', length: '10', isNullable: true },
          { name: 'qr_code_data', type: 'varchar', length: '100', isNullable: true },
          {
            name: 'status',
            type: 'enum',
            enum: ['pre_approved', 'checked_in', 'checked_out', 'rejected', 'expired', 'cancelled'],
            default: "'pre_approved'",
            isNullable: false,
          },
          { name: 'valid_from', type: 'timestamp', isNullable: false },
          { name: 'valid_until', type: 'timestamp', isNullable: false },
          { name: 'is_frequent', type: 'boolean', default: false },
          { name: 'is_blacklisted', type: 'boolean', default: false },
          { name: 'blacklist_reason', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'visitors',
      new TableIndex({ name: 'IDX_visitor_society_id', columnNames: ['society_id'] }),
    );
    await queryRunner.createIndex(
      'visitors',
      new TableIndex({ name: 'IDX_visitor_unit_id', columnNames: ['unit_id'] }),
    );
    await queryRunner.createIndex(
      'visitors',
      new TableIndex({ name: 'IDX_visitor_host_user_id', columnNames: ['host_user_id'] }),
    );
    await queryRunner.createIndex(
      'visitors',
      new TableIndex({ name: 'IDX_visitor_phone', columnNames: ['phone'] }),
    );
    await queryRunner.createIndex(
      'visitors',
      new TableIndex({ name: 'IDX_visitor_passcode', columnNames: ['passcode'] }),
    );
    await queryRunner.createIndex(
      'visitors',
      new TableIndex({ name: 'IDX_visitor_qr_code', columnNames: ['qr_code_data'] }),
    );
    await queryRunner.createIndex(
      'visitors',
      new TableIndex({ name: 'IDX_visitor_status', columnNames: ['status'] }),
    );

    // ─── 4. visitor_logs ──────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'visitor_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'society_id', type: 'uuid', isNullable: false },
          { name: 'visitor_id', type: 'uuid', isNullable: false },
          { name: 'entry_gate_id', type: 'uuid', isNullable: false },
          { name: 'checked_in_by_user_id', type: 'uuid', isNullable: false },
          { name: 'checked_in_at', type: 'timestamp', default: 'now()' },
          { name: 'exit_gate_id', type: 'uuid', isNullable: true },
          { name: 'checked_out_by_user_id', type: 'uuid', isNullable: true },
          { name: 'checked_out_at', type: 'timestamp', isNullable: true },
          { name: 'vehicle_number', type: 'varchar', length: '30', isNullable: true },
          { name: 'photo_url', type: 'varchar', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'visitor_logs',
      new TableIndex({ name: 'IDX_vlog_society_id', columnNames: ['society_id'] }),
    );
    await queryRunner.createIndex(
      'visitor_logs',
      new TableIndex({ name: 'IDX_vlog_visitor_id', columnNames: ['visitor_id'] }),
    );
    await queryRunner.createIndex(
      'visitor_logs',
      new TableIndex({ name: 'IDX_vlog_entry_gate_id', columnNames: ['entry_gate_id'] }),
    );

    // ─── 5. security_incidents ────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'security_incidents',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'society_id', type: 'uuid', isNullable: false },
          { name: 'reported_by_user_id', type: 'uuid', isNullable: false },
          { name: 'gate_id', type: 'uuid', isNullable: true },
          {
            name: 'incident_type',
            type: 'enum',
            enum: [
              'unauthorized_entry',
              'vehicle_violation',
              'property_damage',
              'noise_complaint',
              'sos_panic_alert',
              'other',
            ],
            default: "'other'",
            isNullable: false,
          },
          {
            name: 'severity',
            type: 'enum',
            enum: ['low', 'medium', 'high', 'critical'],
            default: "'low'",
            isNullable: false,
          },
          { name: 'title', type: 'varchar', length: '200', isNullable: false },
          { name: 'description', type: 'text', isNullable: false },
          {
            name: 'status',
            type: 'enum',
            enum: ['reported', 'investigating', 'resolved', 'dismissed'],
            default: "'reported'",
            isNullable: false,
          },
          { name: 'resolved_at', type: 'timestamp', isNullable: true },
          { name: 'resolved_by_user_id', type: 'uuid', isNullable: true },
          { name: 'resolution_notes', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'security_incidents',
      new TableIndex({ name: 'IDX_incident_society_id', columnNames: ['society_id'] }),
    );
    await queryRunner.createIndex(
      'security_incidents',
      new TableIndex({ name: 'IDX_incident_reported_by', columnNames: ['reported_by_user_id'] }),
    );
    await queryRunner.createIndex(
      'security_incidents',
      new TableIndex({ name: 'IDX_incident_gate_id', columnNames: ['gate_id'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('security_incidents', true);
    await queryRunner.dropTable('visitor_logs', true);
    await queryRunner.dropTable('visitors', true);
    await queryRunner.dropTable('gate_assignments', true);
    await queryRunner.dropTable('gates', true);
  }
}
