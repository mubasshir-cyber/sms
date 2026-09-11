import { Entity, Column, Index, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { AssetCategory, AssetStatus } from '../../../common/enums/asset.enum';
import { AssetMaintenanceLog } from './asset-maintenance-log.entity';
import { AssetMaintenanceSchedule } from './asset-maintenance-schedule.entity';
import { AssetDepreciationLog } from './asset-depreciation-log.entity';

/**
 * Asset Entity — Represents a physical asset owned by the society.
 * Table: assets
 */
@Entity('assets')
@Index('IDX_assets_society_category', ['societyId', 'category'])
@Index('IDX_assets_society_status', ['societyId', 'status'])
@Index('IDX_assets_warranty_expiry', ['societyId', 'warrantyExpiryDate'])
@Index('IDX_assets_amc_expiry', ['societyId', 'amcExpiryDate'])
export class Asset extends BaseEntity {
  @Index('IDX_assets_society_id')
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Column({
    type: 'enum',
    enum: AssetCategory,
    default: AssetCategory.OTHER,
  })
  category: AssetCategory;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  model: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  manufacturer: string | null;

  @Column({ name: 'serial_number', type: 'varchar', length: 100, nullable: true })
  serialNumber: string | null;

  @Column({ type: 'varchar', length: 255 })
  location: string;

  @Column({ name: 'purchase_date', type: 'date', nullable: true })
  purchaseDate: Date | null;

  @Column({
    name: 'purchase_cost',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  purchaseCost: number | null;

  /**
   * Current book value; decremented as depreciation entries are recorded.
   */
  @Column({
    name: 'current_value',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  currentValue: number | null;

  @Column({ name: 'warranty_expiry_date', type: 'date', nullable: true })
  warrantyExpiryDate: Date | null;

  /**
   * Optional FK to the Vendor responsible for this asset's AMC.
   */
  @Column({ name: 'amc_vendor_id', type: 'uuid', nullable: true })
  amcVendorId: string | null;

  /**
   * Optional FK to the specific VendorContract for this asset's AMC.
   */
  @Column({ name: 'amc_contract_id', type: 'uuid', nullable: true })
  amcContractId: string | null;

  @Column({ name: 'amc_expiry_date', type: 'date', nullable: true })
  amcExpiryDate: Date | null;

  /**
   * Tracks when the last warranty alert was fired so we don't re-send.
   */
  @Column({ name: 'last_warranty_alert_sent_at', type: 'timestamp', nullable: true })
  lastWarrantyAlertSentAt: Date | null;

  /**
   * Tracks when the last AMC expiry alert was fired.
   */
  @Column({ name: 'last_amc_alert_sent_at', type: 'timestamp', nullable: true })
  lastAmcAlertSentAt: Date | null;

  @Column({ type: 'enum', enum: AssetStatus, default: AssetStatus.ACTIVE })
  status: AssetStatus;

  /**
   * Date the asset was disposed / written off.
   */
  @Column({ name: 'disposal_date', type: 'date', nullable: true })
  disposalDate: Date | null;

  /**
   * Residual / salvage value recorded at disposal.
   */
  @Column({
    name: 'disposal_value',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  disposalValue: number | null;

  @Column({ name: 'photo_urls', type: 'jsonb', nullable: true })
  photoUrls: string[] | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => AssetMaintenanceLog, (log) => log.asset)
  maintenanceLogs: AssetMaintenanceLog[];

  @OneToMany(() => AssetMaintenanceSchedule, (schedule) => schedule.asset)
  maintenanceSchedules: AssetMaintenanceSchedule[];

  @OneToMany(() => AssetDepreciationLog, (depreciation) => depreciation.asset)
  depreciationLogs: AssetDepreciationLog[];
}
