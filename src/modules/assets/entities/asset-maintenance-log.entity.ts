import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import {
  MaintenanceType,
  MaintenanceLogStatus,
} from '../../../common/enums/asset.enum';
import { Asset } from './asset.entity';

/**
 * AssetMaintenanceLog Entity — Records each individual maintenance activity on an asset.
 * Table: asset_maintenance_logs
 */
@Entity('asset_maintenance_logs')
@Index('IDX_aml_society_asset', ['societyId', 'assetId'])
@Index('IDX_aml_society_status', ['societyId', 'status'])
@Index('IDX_aml_scheduled_date', ['societyId', 'scheduledDate'])
export class AssetMaintenanceLog extends BaseEntity {
  @Index('IDX_aml_society_id')
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Column({ name: 'asset_id', type: 'uuid' })
  assetId: string;

  @ManyToOne(() => Asset, (asset) => asset.maintenanceLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  @Column({ name: 'maintenance_type', type: 'enum', enum: MaintenanceType })
  maintenanceType: MaintenanceType;

  @Column({ name: 'performed_by', type: 'varchar', length: 200, nullable: true })
  performedBy: string | null;

  /**
   * Optional FK to the Vendor who performed this maintenance.
   */
  @Column({ name: 'vendor_id', type: 'uuid', nullable: true })
  vendorId: string | null;

  @Column({ name: 'scheduled_date', type: 'date' })
  scheduledDate: Date;

  @Column({ name: 'completed_date', type: 'date', nullable: true })
  completedDate: Date | null;

  @Column({ type: 'enum', enum: MaintenanceLogStatus, default: MaintenanceLogStatus.SCHEDULED })
  status: MaintenanceLogStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost: number | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  findings: string | null;

  @Column({ name: 'next_maintenance_date', type: 'date', nullable: true })
  nextMaintenanceDate: Date | null;

  @Column({ name: 'document_urls', type: 'jsonb', nullable: true })
  documentUrls: string[] | null;
}
