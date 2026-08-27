export enum Role {
  SUPER_ADMIN = 'super_admin',
  SOCIETY_ADMIN = 'society_admin',
  COMMITTEE_MEMBER = 'committee_member',
  ACCOUNTANT = 'accountant',
  FACILITY_MANAGER = 'facility_manager',
  RESIDENT = 'resident',
  TENANT = 'tenant',
  SECURITY_GUARD = 'security_guard',
  VENDOR = 'vendor',
}

/**
 * Roles that have access to the Admin Web Portal
 */
export const ADMIN_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.SOCIETY_ADMIN,
  Role.COMMITTEE_MEMBER,
  Role.ACCOUNTANT,
  Role.FACILITY_MANAGER,
];

/**
 * Roles scoped to a specific society (all except SUPER_ADMIN)
 */
export const SOCIETY_SCOPED_ROLES: Role[] = [
  Role.SOCIETY_ADMIN,
  Role.COMMITTEE_MEMBER,
  Role.ACCOUNTANT,
  Role.FACILITY_MANAGER,
  Role.RESIDENT,
  Role.TENANT,
  Role.SECURITY_GUARD,
  Role.VENDOR,
];

/**
 * Resident-facing roles (Mobile App users)
 */
export const RESIDENT_ROLES: Role[] = [Role.RESIDENT, Role.TENANT];
