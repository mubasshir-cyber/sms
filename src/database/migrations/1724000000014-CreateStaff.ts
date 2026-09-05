import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Migration: CreateStaff
 * Creates: staff_members, staff_attendance, staff_shifts, staff_leaves, staff_tasks
 * Depends on: societies (1724000000005), users (1724000000001), gates (1724000000012)
 */
export class CreateStaff1724000000014 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── 1. staff_members ────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'staff_members',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'society_id', type: 'uuid', isNullable: false },
          { name: 'staff_code', type: 'varchar', length: '20', isNullable: true },
          {
            name: 'staff_type',
            type: 'enum',
            enum: [
              'security_guard', 'housekeeping', 'gardener', 'electrician',
              'plumber', 'maintenance', 'driver', 'cook', 'domestic_help',
              'society_manager', 'other',
            ],
            default: "'other'",
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'on_leave', 'resigned', 'terminated', 'on_probation'],
            default: "'active'",
            isNullable: false,
          },
          { name: 'name', type: 'varchar', length: '150', isNullable: false },
          { name: 'phone', type: 'varchar', length: '20', isNullable: false },
          { name: 'email', type: 'varchar', length: '150', isNullable: true },
          { name: 'date_of_birth', type: 'date', isNullable: true },
          { name: 'address', type: 'text', isNullable: true },
          { name: 'photo_url', type: 'varchar', length: '500', isNullable: true },
          { name: 'aadhaar_number', type: 'varchar', length: '255', isNullable: true },
          { name: 'pan_number', type: 'varchar', length: '50', isNullable: true },
          { name: 'monthly_wage', type: 'decimal', precision: 10, scale: 2, isNullable: true },
          {
            name: 'default_shift',
            type: 'enum',
            enum: ['morning', 'evening', 'night', 'full_day', 'custom'],
            default: "'morning'",
            isNullable: false,
          },
          { name: 'join_date', type: 'date', isNullable: true },
          { name: 'exit_date', type: 'date', isNullable: true },
          { name: 'exit_reason', type: 'text', isNullable: true },
          { name: 'is_domestic_help', type: 'boolean', default: false },
          { name: 'police_verification_url', type: 'varchar', length: '500', isNullable: true },
          { name: 'aadhaar_doc_url', type: 'varchar', length: '500', isNullable: true },
          { name: 'id_proof_doc_url', type: 'varchar', length: '500', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'staff_members',
      new TableIndex({ name: 'IDX_staff_members_society_status', columnNames: ['society_id', 'status'] }),
    );
    await queryRunner.createIndex(
      'staff_members',
      new TableIndex({ name: 'IDX_staff_members_society_type', columnNames: ['society_id', 'staff_type'] }),
    );

    // ─── 2. staff_attendance ─────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'staff_attendance',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'society_id', type: 'uuid', isNullable: false },
          { name: 'staff_id', type: 'uuid', isNullable: false },
          { name: 'date', type: 'date', isNullable: false },
          {
            name: 'status',
            type: 'enum',
            enum: ['present', 'absent', 'half_day', 'on_leave', 'holiday'],
            default: "'present'",
            isNullable: false,
          },
          { name: 'checkin_time', type: 'time', isNullable: true },
          { name: 'checkout_time', type: 'time', isNullable: true },
          { name: 'gate_id', type: 'uuid', isNullable: true },
          { name: 'marked_by_user_id', type: 'uuid', isNullable: false },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'staff_attendance',
      new TableIndex({ name: 'IDX_staff_attendance_society_date', columnNames: ['society_id', 'date'] }),
    );
    await queryRunner.createIndex(
      'staff_attendance',
      new TableIndex({ name: 'IDX_staff_attendance_staff_date', columnNames: ['staff_id', 'date'] }),
    );

    // ─── 3. staff_shifts ─────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'staff_shifts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'society_id', type: 'uuid', isNullable: false },
          { name: 'staff_id', type: 'uuid', isNullable: false },
          {
            name: 'shift_type',
            type: 'enum',
            enum: ['morning', 'evening', 'night', 'full_day', 'custom'],
            default: "'morning'",
            isNullable: false,
          },
          { name: 'start_time', type: 'varchar', length: '5', isNullable: false },
          { name: 'end_time', type: 'varchar', length: '5', isNullable: false },
          { name: 'effective_from', type: 'date', isNullable: true },
          { name: 'effective_to', type: 'date', isNullable: true },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'notes', type: 'varchar', length: '500', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'staff_shifts',
      new TableIndex({ name: 'IDX_staff_shifts_staff_id', columnNames: ['society_id', 'staff_id'] }),
    );

    // ─── 4. staff_leaves ─────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'staff_leaves',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'society_id', type: 'uuid', isNullable: false },
          { name: 'staff_id', type: 'uuid', isNullable: false },
          {
            name: 'leave_type',
            type: 'enum',
            enum: ['casual', 'sick', 'earned', 'unpaid', 'maternity', 'paternity'],
            default: "'casual'",
            isNullable: false,
          },
          { name: 'start_date', type: 'date', isNullable: false },
          { name: 'end_date', type: 'date', isNullable: false },
          { name: 'total_days', type: 'decimal', precision: 4, scale: 1, isNullable: false },
          { name: 'reason', type: 'text', isNullable: false },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'approved', 'rejected', 'cancelled'],
            default: "'pending'",
            isNullable: false,
          },
          { name: 'applied_by_user_id', type: 'uuid', isNullable: false },
          { name: 'approved_by_user_id', type: 'uuid', isNullable: true },
          { name: 'approved_at', type: 'timestamp', isNullable: true },
          { name: 'rejection_reason', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'staff_leaves',
      new TableIndex({ name: 'IDX_staff_leaves_staff_id', columnNames: ['society_id', 'staff_id'] }),
    );
    await queryRunner.createIndex(
      'staff_leaves',
      new TableIndex({ name: 'IDX_staff_leaves_status', columnNames: ['society_id', 'status'] }),
    );

    // ─── 5. staff_tasks ──────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'staff_tasks',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'society_id', type: 'uuid', isNullable: false },
          { name: 'staff_id', type: 'uuid', isNullable: false },
          { name: 'assigned_by_user_id', type: 'uuid', isNullable: false },
          { name: 'title', type: 'varchar', length: '200', isNullable: false },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'due_date', type: 'date', isNullable: true },
          { name: 'is_completed', type: 'boolean', default: false },
          { name: 'completed_at', type: 'timestamp', isNullable: true },
          { name: 'completion_notes', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'staff_tasks',
      new TableIndex({ name: 'IDX_staff_tasks_staff_id', columnNames: ['society_id', 'staff_id'] }),
    );
    await queryRunner.createIndex(
      'staff_tasks',
      new TableIndex({ name: 'IDX_staff_tasks_completed', columnNames: ['society_id', 'is_completed'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('staff_tasks', true);
    await queryRunner.dropTable('staff_leaves', true);
    await queryRunner.dropTable('staff_shifts', true);
    await queryRunner.dropTable('staff_attendance', true);
    await queryRunner.dropTable('staff_members', true);
  }
}
