import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { AmcScheduleStatus } from '../../../common/enums/vendor.enum';
import { VendorContract } from './vendor-contract.entity';
import { Vendor } from './vendor.entity';

/**
 * Vendor AMC Schedule Entity — Represents periodic routine inspection / maintenance visits.
 * Table: vendor_amc_schedules
 */
@Entity('vendor_amc_schedules')
@Index('IDX_amc_schedules_contract', ['societyId', 'contractId'])
@Index('IDX_amc_schedules_scheduled_date', ['societyId', 'scheduledDate'])
export class VendorAmcSchedule extends BaseEntity {
  @Index('IDX_amc_schedules_society_id')
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Column({ name: 'contract_id', type: 'uuid' })
  contractId: string;

  @ManyToOne(() => VendorContract, (contract) => contract.amcSchedules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contract_id' })
  contract: VendorContract;

  @Column({ name: 'vendor_id', type: 'uuid' })
  vendorId: string;

  @ManyToOne(() => Vendor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Column({ name: 'scheduled_date', type: 'date' })
  scheduledDate: Date;

  @Column({ name: 'service_type', type: 'varchar', length: 255 })
  serviceType: string;

  @Column({ type: 'enum', enum: AmcScheduleStatus, default: AmcScheduleStatus.SCHEDULED })
  status: AmcScheduleStatus;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'technician_name', type: 'varchar', length: 150, nullable: true })
  technicianName: string | null;

  @Column({ name: 'technician_phone', type: 'varchar', length: 20, nullable: true })
  technicianPhone: string | null;

  @Column({ name: 'service_report_url', type: 'varchar', length: 500, nullable: true })
  serviceReportUrl: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
