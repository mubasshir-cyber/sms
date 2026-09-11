import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ScopeGuard } from './scope.guard';
import { Role } from '../enums/role.enum';
import type { AuthUser } from '../interfaces/auth-user.interface';

describe('Cross-Tenant & RBAC Security Suite', () => {
  let rolesGuard: RolesGuard;
  let scopeGuard: ScopeGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);
    scopeGuard = new ScopeGuard();
  });

  function createMockContext(user: AuthUser | null, requiredRoles?: Role[]): ExecutionContext {
    if (requiredRoles) {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(requiredRoles);
    } else {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    }

    const request: Record<string, any> = { user };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({}),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  }

  describe('RBAC Privilege Escalation Prevention', () => {
    it('should deny RESIDENT trying to invoke SOCIETY_ADMIN endpoint (403)', () => {
      const residentUser: AuthUser = {
        sub: 'user-resident',
        email: 'resident@society.com',
        role: Role.RESIDENT,
        societyId: 'soc-alpha',
        iat: 0,
        exp: 0,
      };

      const ctx = createMockContext(residentUser, [Role.SOCIETY_ADMIN]);

      expect(() => rolesGuard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('should deny SECURITY_GUARD trying to invoke ACCOUNTANT endpoint (403)', () => {
      const guardUser: AuthUser = {
        sub: 'guard-1',
        email: 'guard@society.com',
        role: Role.SECURITY_GUARD,
        societyId: 'soc-alpha',
        iat: 0,
        exp: 0,
      };

      const ctx = createMockContext(guardUser, [Role.ACCOUNTANT]);

      expect(() => rolesGuard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('should allow SOCIETY_ADMIN to invoke SOCIETY_ADMIN endpoint', () => {
      const adminUser: AuthUser = {
        sub: 'admin-1',
        email: 'admin@society.com',
        role: Role.SOCIETY_ADMIN,
        societyId: 'soc-alpha',
        iat: 0,
        exp: 0,
      };

      const ctx = createMockContext(adminUser, [Role.SOCIETY_ADMIN]);

      expect(rolesGuard.canActivate(ctx)).toBe(true);
    });
  });

  describe('Tenant & Scope Boundary Enforcement', () => {
    it('should block user without societyId from accessing society-scoped resources (403)', () => {
      const brokenUser: AuthUser = {
        sub: 'user-orphaned',
        email: 'orphan@sms.com',
        role: Role.RESIDENT,
        societyId: null, // no society!
        iat: 0,
        exp: 0,
      };

      const ctx = createMockContext(brokenUser);

      expect(() => scopeGuard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('should allow SUPER_ADMIN to bypass societyId restriction', () => {
      const superUser: AuthUser = {
        sub: 'super-1',
        email: 'super@sms.com',
        role: Role.SUPER_ADMIN,
        societyId: null,
        iat: 0,
        exp: 0,
      };

      const ctx = createMockContext(superUser);

      expect(scopeGuard.canActivate(ctx)).toBe(true);
    });

    it('should attach verified societyId to request for service-level consumption', () => {
      const user: AuthUser = {
        sub: 'admin-1',
        email: 'admin@alpha.com',
        role: Role.SOCIETY_ADMIN,
        societyId: 'soc-alpha',
        iat: 0,
        exp: 0,
      };

      const ctx = createMockContext(user);
      const allowed = scopeGuard.canActivate(ctx);

      expect(allowed).toBe(true);
      const req = ctx.switchToHttp().getRequest();
      expect(req.societyId).toBe('soc-alpha');
    });
  });
});
