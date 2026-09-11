import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { DepreciationMethod } from '../../../common/enums/asset.enum';
import { Asset } from './asset.entity';

/**
 * AssetDepreciationLog Entity — Records periodic depreciation calculations for an asset.
 * Table: asset_depreciation_logs
 */
@Entity('asset_depreciation_logs')
@Index('IDX_adl_society_asset', ['societyId', 'assetId'])
@Index('IDX_adl_depreciation_date', ['societyId', 'depreciationDate'])
export class AssetDepreciationLog extends BaseEntity {
  @Index('IDX_adl_society_id')
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Column({ name: 'asset_id', type: 'uuid' })
  assetId: string;

  @ManyToOne(() => Asset, (asset) => asset.depreciationLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  @Column({ name: 'depreciation_date', type: 'date' })
  depreciationDate: Date;

  @Column({ name: 'depreciation_amount', type: 'decimal', precision: 10, scale: 2 })
  depreciationAmount: number;

  /**
   * Resulting book value of the asset AFTER this depreciation entry is applied.
   */
  @Column({ name: 'book_value_after', type: 'decimal', precision: 10, scale: 2 })
  bookValueAfter: number;

  @Column({ type: 'enum', enum: DepreciationMethod, default: DepreciationMethod.STRAIGHT_LINE })
  method: DepreciationMethod;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
