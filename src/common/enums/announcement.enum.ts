export enum AnnouncementType {
  GENERAL = 'general',
  CIRCULAR = 'circular',
  EMERGENCY = 'emergency',
  EVENT = 'event',
  MAINTENANCE = 'maintenance',
  WATER_SHUTDOWN = 'water_shutdown',
  ELECTRICITY_SHUTDOWN = 'electricity_shutdown',
  AGM = 'agm',
  OTHER = 'other',
}

export enum AnnouncementStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum AnnouncementPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum AnnouncementTargetScope {
  SOCIETY = 'society',
  TOWER = 'tower',
  FLOOR = 'floor',
  UNIT = 'unit',
  ROLE_GROUP = 'role_group',
}

export enum AnnouncementTargetRole {
  ALL_RESIDENTS = 'all_residents',
  OWNER = 'owner',
  TENANT = 'tenant',
}
