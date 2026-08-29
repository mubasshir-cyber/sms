export enum BillingRuleType {
  PER_UNIT = 'per_unit',       // Fixed amount regardless of unit size
  PER_SQFT = 'per_sqft',       // Amount × unit square footage
  FIXED = 'fixed',             // One flat charge for the entire society split equally
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  WAIVED = 'waived',
  PARTIALLY_PAID = 'partially_paid',
}
