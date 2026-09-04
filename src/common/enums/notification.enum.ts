export enum NotificationType {
  // ─── Billing
  INVOICE_GENERATED = 'invoice_generated',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_OVERDUE = 'payment_overdue',
  RECEIPT_SENT = 'receipt_sent',
  // ─── Complaints
  COMPLAINT_RAISED = 'complaint_raised',
  COMPLAINT_ASSIGNED = 'complaint_assigned',
  COMPLAINT_STATUS_UPDATE = 'complaint_status_update',
  COMPLAINT_ESCALATED = 'complaint_escalated',
  // ─── General
  ANNOUNCEMENT = 'announcement',
  GENERAL = 'general',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}
