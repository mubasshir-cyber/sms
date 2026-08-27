import { Role } from '../enums/role.enum';

/**
 * Represents the authenticated user extracted from the JWT payload.
 * Injected via @CurrentUser() decorator in controllers.
 */
export interface AuthUser {
  /** User UUID */
  sub: string;

  /** User email address */
  email: string;

  /** User's assigned role */
  role: Role;

  /** Society UUID — null for SUPER_ADMIN */
  societyId: string | null;

  /** Unit UUID — populated for RESIDENT and TENANT */
  unitId?: string | null;

  /** Gate UUID — populated for SECURITY_GUARD */
  gateId?: string | null;

  /** Vendor UUID — populated for VENDOR */
  vendorId?: string | null;

  /** JWT issued-at timestamp */
  iat: number;

  /** JWT expiration timestamp */
  exp: number;
}
