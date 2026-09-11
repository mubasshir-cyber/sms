import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { MaintenanceFrequency } from '../../../common/enums/asset.enum';
import { Asset } from './asset.entity';

/**
 * AssetMaintenanceSchedule Entity — Defines a recurring maintenance schedule for an asset.
 * Table: asset_maintenance_schedules
 */
@Entity('asset_maintenance_schedules')
@Index('IDX_ams_society_asset', ['societyId', 'assetId'])
@Index('IDX_ams_next_due', ['societyId', 'nextDueDate', 'isActive'])
export class AssetMaintenanceSchedule extends BaseEntity {
  @Index('IDX_ams_society_id')
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Column({ name: 'asset_id', type: 'uuid' })
  assetId: string;

  @ManyToOne(() => Asset, (asset) => asset.maintenanceSchedules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  @Column({ type: 'enum', enum: MaintenanceFrequency })
  frequency: MaintenanceFrequency;

  @Column({ name: 'last_performed_at', type: 'date', nullable: true })
  lastPerformedAt: Date | null;

  @Column({ name: 'next_due_date', type: 'date' })
  nextDueDate: Date;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
