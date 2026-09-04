/**
 * Complaint Enums — used by the Complaints & Helpdesk module.
 */

export enum ComplaintStatus {
  OPEN        = 'open',
  ASSIGNED    = 'assigned',
  IN_PROGRESS = 'in_progress',
  RESOLVED    = 'resolved',
  CLOSED      = 'closed',
  ESCALATED   = 'escalated',
}

export enum ComplaintPriority {
  LOW      = 'low',
  MEDIUM   = 'medium',
  HIGH     = 'high',
  CRITICAL = 'critical',
}

export enum ComplaintCategory {
  PLUMBING      = 'plumbing',
  ELECTRICAL    = 'electrical',
  LIFT          = 'lift',
  SECURITY      = 'security',
  HOUSEKEEPING  = 'housekeeping',
  PARKING       = 'parking',
  WATER_SUPPLY  = 'water_supply',
  STRUCTURAL    = 'structural',
  INTERNET_CCTV = 'internet_cctv',
  OTHER         = 'other',
}

/** Statuses that allow a complaint to still be worked on (not yet terminal) */
export const ACTIVE_COMPLAINT_STATUSES: ComplaintStatus[] = [
  ComplaintStatus.OPEN,
  ComplaintStatus.ASSIGNED,
  ComplaintStatus.IN_PROGRESS,
  ComplaintStatus.ESCALATED,
];

/** Valid forward-only status transitions */
export const COMPLAINT_STATUS_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  [ComplaintStatus.OPEN]:        [ComplaintStatus.ASSIGNED, ComplaintStatus.ESCALATED],
  [ComplaintStatus.ASSIGNED]:    [ComplaintStatus.IN_PROGRESS, ComplaintStatus.ESCALATED],
  [ComplaintStatus.IN_PROGRESS]: [ComplaintStatus.RESOLVED, ComplaintStatus.ESCALATED],
  [ComplaintStatus.RESOLVED]:    [ComplaintStatus.CLOSED],
  [ComplaintStatus.ESCALATED]:   [ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS],
  [ComplaintStatus.CLOSED]:      [], // Terminal state
};
