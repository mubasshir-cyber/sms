/**
 * High-level folder category for a society document.
 */
export enum DocumentCategory {
  SOCIETY = 'society',
  RESIDENT = 'resident',
  VENDOR = 'vendor',
  FINANCE = 'finance',
  LEGAL = 'legal',
  COMPLIANCE = 'compliance',
  MEETING = 'meeting',
  OTHER = 'other',
}

/**
 * The type of entity that owns / is associated with this document.
 */
export enum DocumentOwnerType {
  SOCIETY = 'society',
  RESIDENT = 'resident',
  VENDOR = 'vendor',
  STAFF = 'staff',
  ASSET = 'asset',
}

/**
 * Who within the society is allowed to read this document.
 */
export enum DocumentAccessLevel {
  ADMIN_ONLY = 'admin_only',
  COMMITTEE = 'committee',
  ALL_RESIDENTS = 'all_residents',
}

/**
 * Lifecycle status of a document record.
 */
export enum DocumentStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

/**
 * Audit action recorded in the document access log.
 */
export enum DocumentAction {
  VIEWED = 'viewed',
  DOWNLOADED = 'downloaded',
  DELETED = 'deleted',
  VERSION_UPLOADED = 'version_uploaded',
}
