export enum NotificationType {
  INVOICE_GENERATED = 'invoice_generated',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_OVERDUE = 'payment_overdue',
  RECEIPT_SENT = 'receipt_sent',
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
