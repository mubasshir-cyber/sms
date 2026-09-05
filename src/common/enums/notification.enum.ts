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
  // ─── Deliveries
  DELIVERY_ARRIVED = 'delivery_arrived',
  DELIVERY_COLLECTED = 'delivery_collected',
  DELIVERY_UNATTENDED_ALERT = 'delivery_unattended_alert',
  DELIVERY_DIRECT_ENTRY = 'delivery_direct_entry',
  // ─── Staff
  LEAVE_REQUEST = 'leave_request',
  LEAVE_APPROVED = 'leave_approved',
  LEAVE_REJECTED = 'leave_rejected',
  ATTENDANCE_ALERT = 'attendance_alert',
  // ─── Announcements
  ANNOUNCEMENT_PUBLISHED = 'announcement_published',
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
