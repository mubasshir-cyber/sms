import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { BillingRuleType } from '../../../common/enums/billing.enum';
import { UnitType } from '../../../common/enums/unit-type.enum';

@Entity('billing_rules')
export class BillingRule extends BaseEntity {
  @Index('IDX_brule_society_id')
  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Column({ name: 'head_id', type: 'uuid' })
  headId: string;

  @Column({ name: 'rule_type', type: 'enum', enum: BillingRuleType })
  ruleType: BillingRuleType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  /** null = applies to all unit types */
  @Column({ name: 'unit_type', type: 'enum', enum: UnitType, nullable: true })
  unitType: UnitType | null;

  @Column({ name: 'effective_from', type: 'date' })
  effectiveFrom: Date;

  @Column({ name: 'effective_to', type: 'date', nullable: true })
  effectiveTo: Date | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
