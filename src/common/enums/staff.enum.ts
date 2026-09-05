export enum StaffType {
  SECURITY_GUARD = 'security_guard',
  HOUSEKEEPING = 'housekeeping',
  GARDENER = 'gardener',
  ELECTRICIAN = 'electrician',
  PLUMBER = 'plumber',
  MAINTENANCE = 'maintenance',
  DRIVER = 'driver',
  COOK = 'cook',
  DOMESTIC_HELP = 'domestic_help',
  SOCIETY_MANAGER = 'society_manager',
  OTHER = 'other',
}

export enum ShiftType {
  MORNING = 'morning',
  EVENING = 'evening',
  NIGHT = 'night',
  FULL_DAY = 'full_day',
  CUSTOM = 'custom',
}

export enum StaffStatus {
  ACTIVE = 'active',
  ON_LEAVE = 'on_leave',
  RESIGNED = 'resigned',
  TERMINATED = 'terminated',
  ON_PROBATION = 'on_probation',
}

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  HALF_DAY = 'half_day',
  ON_LEAVE = 'on_leave',
  HOLIDAY = 'holiday',
}

export enum LeaveStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum LeaveType {
  CASUAL = 'casual',
  SICK = 'sick',
  EARNED = 'earned',
  UNPAID = 'unpaid',
  MATERNITY = 'maternity',
  PATERNITY = 'paternity',
}
