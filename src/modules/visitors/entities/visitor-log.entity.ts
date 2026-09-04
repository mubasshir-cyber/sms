import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * VisitorLog Entity — physical entry and exit movements across gates.
 * Table: visitor_logs
 */
@Entity('visitor_logs')
export class VisitorLog extends BaseEntity {
  @Index('IDX_vlog_society_id')
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Index('IDX_vlog_visitor_id')
  @Column({ name: 'visitor_id', type: 'uuid' })
  visitorId: string;

  @Index('IDX_vlog_entry_gate_id')
  @Column({ name: 'entry_gate_id', type: 'uuid' })
  entryGateId: string;

  @Column({ name: 'checked_in_by_user_id', type: 'uuid' })
  checkedInByUserId: string;

  @Column({ name: 'checked_in_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  checkedInAt: Date;

  @Column({ name: 'exit_gate_id', type: 'uuid', nullable: true })
  exitGateId: string | null;

  @Column({ name: 'checked_out_by_user_id', type: 'uuid', nullable: true })
  checkedOutByUserId: string | null;

  @Column({ name: 'checked_out_at', type: 'timestamp', nullable: true })
  checkedOutAt: Date | null;

  @Column({ name: 'vehicle_number', type: 'varchar', length: 30, nullable: true })
  vehicleNumber: string | null;

  @Column({ name: 'photo_url', type: 'varchar', nullable: true })
  photoUrl: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
