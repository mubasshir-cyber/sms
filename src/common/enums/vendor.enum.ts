/**
 * Vendor Categories representing types of service providers contracted by a housing society.
 */
export enum VendorCategory {
  LIFT_AMC = 'lift_amc',
  CCTV_SECURITY = 'cctv_security',
  CLEANING_HOUSEKEEPING = 'cleaning_housekeeping',
  ELECTRICAL = 'electrical',
  PLUMBING = 'plumbing',
  GARDENING_LANDSCAPING = 'gardening_landscaping',
  PEST_CONTROL = 'pest_control',
  FIRE_SAFETY = 'fire_safety',
  INTERNET_CABLE = 'internet_cable',
  WASTE_MANAGEMENT = 'waste_management',
  SWIMMING_POOL = 'swimming_pool',
  OTHER = 'other',
}

/**
 * Operational status of a Vendor within a society.
 */
export enum VendorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLACKLISTED = 'blacklisted',
}

/**
 * Status of a Vendor Contract or AMC Agreement.
 */
export enum ContractStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
}

/**
 * Billing frequency for ongoing service contracts.
 */
export enum ContractBillingFrequency {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  HALF_YEARLY = 'half_yearly',
  ANNUAL = 'annual',
  ONE_TIME = 'one_time',
}

/**
 * Status of an AMC routine visit or maintenance schedule.
 */
export enum AmcScheduleStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  MISSED = 'missed',
  CANCELLED = 'cancelled',
}

/**
 * Payment & approval status of a Vendor Invoice.
 */
export enum VendorInvoiceStatus {
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
  REJECTED = 'rejected',
}
