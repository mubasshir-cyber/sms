import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import {
  IncidentType,
  IncidentSeverity,
  IncidentStatus,
} from '../../../common/enums/visitor.enum';

/**
 * SecurityIncident Entity — reports security incidents, unauthorized entries, and SOS panic alerts.
 * Table: security_incidents
 */
@Entity('security_incidents')
export class SecurityIncident extends BaseEntity {
  @Index('IDX_incident_society_id')
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Index('IDX_incident_reported_by')
  @Column({ name: 'reported_by_user_id', type: 'uuid' })
  reportedByUserId: string;

  @Index('IDX_incident_gate_id')
  @Column({ name: 'gate_id', type: 'uuid', nullable: true })
  gateId: string | null;

  @Column({
    name: 'incident_type',
    type: 'enum',
    enum: IncidentType,
    default: IncidentType.OTHER,
  })
  incidentType: IncidentType;

  @Column({
    type: 'enum',
    enum: IncidentSeverity,
    default: IncidentSeverity.LOW,
  })
  severity: IncidentSeverity;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: IncidentStatus,
    default: IncidentStatus.REPORTED,
  })
  status: IncidentStatus;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: Date | null;

  @Column({ name: 'resolved_by_user_id', type: 'uuid', nullable: true })
  resolvedByUserId: string | null;

  @Column({ name: 'resolution_notes', type: 'text', nullable: true })
  resolutionNotes: string | null;
}
