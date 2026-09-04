export enum GateType {
  ENTRY_EXIT = 'entry_exit',
  ENTRY_ONLY = 'entry_only',
  EXIT_ONLY = 'exit_only',
  EMERGENCY = 'emergency',
}

export enum VisitorType {
  GUEST = 'guest',
  DELIVERY = 'delivery',
  CAB = 'cab',
  SERVICE_PROVIDER = 'service_provider',
  OTHER = 'other',
}

export enum VisitorStatus {
  PRE_APPROVED = 'pre_approved',
  CHECKED_IN = 'checked_in',
  CHECKED_OUT = 'checked_out',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum IncidentType {
  UNAUTHORIZED_ENTRY = 'unauthorized_entry',
  VEHICLE_VIOLATION = 'vehicle_violation',
  PROPERTY_DAMAGE = 'property_damage',
  NOISE_COMPLAINT = 'noise_complaint',
  SOS_PANIC_ALERT = 'sos_panic_alert',
  OTHER = 'other',
}

export enum IncidentSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum IncidentStatus {
  REPORTED = 'reported',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}
