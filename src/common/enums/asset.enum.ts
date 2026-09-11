/**
 * Physical asset categories tracked within a housing society.
 */
export enum AssetCategory {
  LIFT = 'lift',
  GENERATOR = 'generator',
  PUMP_MOTOR = 'pump_motor',
  CCTV = 'cctv',
  FIRE_SAFETY = 'fire_safety',
  GYM_EQUIPMENT = 'gym_equipment',
  FURNITURE = 'furniture',
  ELECTRICAL_PANEL = 'electrical_panel',
  WATER_TANK = 'water_tank',
  OTHER = 'other',
}

/**
 * Operational lifecycle status of an asset.
 */
export enum AssetStatus {
  ACTIVE = 'active',
  UNDER_MAINTENANCE = 'under_maintenance',
  DISPOSED = 'disposed',
}

/**
 * Type of maintenance activity performed on an asset.
 */
export enum MaintenanceType {
  PREVENTIVE = 'preventive',
  CORRECTIVE = 'corrective',
  INSPECTION = 'inspection',
  AMC_VISIT = 'amc_visit',
}

/**
 * Workflow status of a single maintenance log entry.
 */
export enum MaintenanceLogStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * Recurrence frequency for a standing maintenance schedule.
 */
export enum MaintenanceFrequency {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  HALF_YEARLY = 'half_yearly',
  ANNUAL = 'annual',
}

/**
 * Accounting method used when recording an asset depreciation entry.
 */
export enum DepreciationMethod {
  STRAIGHT_LINE = 'straight_line',
  DECLINING_BALANCE = 'declining_balance',
}
