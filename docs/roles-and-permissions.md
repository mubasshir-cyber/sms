# 🔐 Roles & Permissions — Society Management System

> **Version:** V1  
> **Last Updated:** August 2026  
> **Auth Strategy:** JWT + RBAC (Role-Based Access Control)  
> **Enforcement:** NestJS Guards + TypeORM row-level data scoping  

---

## Overview

The system has **9 distinct roles** organized in a strict hierarchy. Every API endpoint is guarded by:
1. **Authentication Guard** — Valid JWT required
2. **Role Guard** — Role must be allowed for that route
3. **Data Scope Guard** — User can only access data within their assigned society / tower / unit

```
super_admin
    └── society_admin
            ├── committee_member
            ├── accountant
            ├── facility_manager
            ├── resident / owner
            │       └── tenant
            ├── security_guard
            └── vendor
```

---

## Role Definitions

| Role Enum | Display Name | Scope | Description |
|---|---|---|---|
| `SUPER_ADMIN` | Super Admin | Platform-wide | Full access to all societies, all modules, all data |
| `SOCIETY_ADMIN` | Society Admin | Society-scoped | Full control within their registered society |
| `COMMITTEE_MEMBER` | Committee Member | Society-scoped | Elevated resident — approvals, governance, reports |
| `ACCOUNTANT` | Accountant | Society-scoped | Finance-only access (billing, payments, expenses) |
| `FACILITY_MANAGER` | Facility Manager | Society-scoped | Operations — staff, vendors, assets, amenities |
| `RESIDENT` | Owner / Resident | Unit-scoped | Self-service — bills, complaints, bookings |
| `TENANT` | Tenant | Unit-scoped | Limited resident — bills, complaints only |
| `SECURITY_GUARD` | Security Guard | Gate-scoped | Visitor, delivery, gate management only |
| `VENDOR` | Vendor | Vendor-scoped | View own contracts and invoices only |

---

## Permission Matrix

### Legend
| Symbol | Meaning |
|---|---|
| ✅ | Full access (CRUD) |
| 👁️ | Read only |
| ✏️ | Create + Read + Update |
| ➕ | Create only |
| ❌ | No access |
| 🔒 | Own records only |

---

### Module-Level Permissions

| Module | `SUPER_ADMIN` | `SOCIETY_ADMIN` | `COMMITTEE_MEMBER` | `ACCOUNTANT` | `FACILITY_MANAGER` | `RESIDENT` | `TENANT` | `SECURITY_GUARD` | `VENDOR` |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Tenant Management** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Society Profile** | ✅ | ✅ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | ❌ | ❌ |
| **Society Structure** | ✅ | ✅ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ | ❌ | ❌ |
| **Residents** | ✅ | ✅ | 👁️ | 👁️ | 👁️ | 🔒 | 🔒 | 👁️ | ❌ |
| **Vehicles & Parking** | ✅ | ✅ | 👁️ | ❌ | ✅ | 🔒 | 🔒 | ✏️ | ❌ |
| **Maintenance & Billing** | ✅ | ✅ | 👁️ | ✅ | ❌ | 🔒 | 🔒 | ❌ | ❌ |
| **Payments & Receipts** | ✅ | ✅ | 👁️ | ✅ | ❌ | 🔒 | 🔒 | ❌ | ❌ |
| **Expense & Finance** | ✅ | ✅ | 👁️ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Complaints** | ✅ | ✅ | ✅ | ❌ | ✅ | 🔒 | 🔒 | ❌ | ❌ |
| **Visitor Management** | ✅ | ✅ | 👁️ | ❌ | ❌ | ✏️ | ✏️ | ✅ | ❌ |
| **Security & Gates** | ✅ | ✅ | 👁️ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Delivery Management** | ✅ | ✅ | ❌ | ❌ | ❌ | 🔒 | 🔒 | ✅ | ❌ |
| **Amenity Booking** | ✅ | ✅ | ✅ | ❌ | ✅ | 🔒 | 🔒 | ❌ | ❌ |
| **Staff Management** | ✅ | ✅ | 👁️ | 👁️ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Vendor Management** | ✅ | ✅ | 👁️ | 👁️ | ✅ | ❌ | ❌ | ❌ | 🔒 |
| **Asset Management** | ✅ | ✅ | 👁️ | 👁️ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Announcements** | ✅ | ✅ | ✏️ | ❌ | ✏️ | 👁️ | 👁️ | 👁️ | ❌ |
| **Documents & Records** | ✅ | ✅ | 👁️ | 👁️ | 👁️ | 🔒 | 🔒 | ❌ | 🔒 |
| **Meetings & Governance** | ✅ | ✅ | ✅ | 👁️ | ❌ | 👁️ | ❌ | ❌ | ❌ |
| **Reports** | ✅ | ✅ | 👁️ | ✅ | 👁️ | ❌ | ❌ | ❌ | ❌ |
| **Audit Logs** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **System Settings** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Super Dashboard** | ✅ | ✅ | 👁️ | 👁️ | 👁️ | ❌ | ❌ | ❌ | ❌ |
| **User Management** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Role Assignment** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Detailed Role Breakdown

---

### 1. `SUPER_ADMIN` — Super Administrator

**Scope:** Entire platform — all tenants, all societies  
**Created By:** System (seeded at deployment)  
**Login:** Admin Portal only

#### Access Summary
- Full CRUD on all modules across all societies
- Can create, suspend, and delete societies (tenants)
- Can manage subscription plans
- Can access global audit logs
- Cannot be deleted or demoted by any other role
- Can impersonate `SOCIETY_ADMIN` for debugging

#### Restrictions
- No resident-facing mobile app access
- All actions are audit-logged with IP

---

### 2. `SOCIETY_ADMIN` — Society Administrator

**Scope:** Their registered society only  
**Created By:** `SUPER_ADMIN` during society onboarding  
**Login:** Admin Web Portal

#### Access Summary
- Full CRUD on all modules within their society
- Can create and manage all roles below them
- Can configure society settings, billing rules, SLA rules
- Can view all financial reports
- Can manage all residents, staff, vendors

#### Restrictions
- Cannot access other societies
- Cannot modify system-level configurations
- Cannot access platform billing (SaaS)

---

### 3. `COMMITTEE_MEMBER` — Managing Committee Member

**Scope:** Society-scoped  
**Created By:** `SOCIETY_ADMIN`  
**Login:** Admin Web Portal + Mobile App

#### Access Summary
- Can view all residents, complaints, announcements
- Can approve complaint resolutions
- Can create and manage society announcements
- Can participate in meetings and vote on resolutions
- Can view financial reports (read-only)
- Can approve amenity bookings

#### Restrictions
- Cannot manage billing or payment settings
- Cannot manage staff or vendors
- Cannot access audit logs
- Cannot change society settings

---

### 4. `ACCOUNTANT` — Society Accountant

**Scope:** Society-scoped (Finance modules only)  
**Created By:** `SOCIETY_ADMIN`  
**Login:** Admin Web Portal

#### Access Summary
- Full access to Maintenance & Billing
- Full access to Payments & Receipts
- Full access to Expense & Finance
- Can generate all financial reports
- Can reconcile payments
- Can process refunds
- Can manage vendor invoices and payments

#### Restrictions
- No access to Residents module (can only see resident name on invoices)
- No access to Complaints, Visitors, Security
- No access to Staff, Vendors (profile), Assets
- No access to system settings

---

### 5. `FACILITY_MANAGER` — Facility Manager

**Scope:** Society-scoped (Operations modules)  
**Created By:** `SOCIETY_ADMIN`  
**Login:** Admin Web Portal

#### Access Summary
- Full access to Staff Management
- Full access to Vendor Management
- Full access to Asset Management
- Full access to Complaints (assign, close)
- Full access to Amenity Booking management
- Full access to Vehicles & Parking
- Can post announcements
- Can view operational reports

#### Restrictions
- No access to Financial modules (billing, payments, expenses)
- No access to Meetings & Governance
- No access to Audit Logs
- No access to System Settings

---

### 6. `RESIDENT` (Owner) — Resident / Owner

**Scope:** Own unit + family + associated records only  
**Created By:** `SOCIETY_ADMIN` (registration)  
**Login:** Resident Mobile App + Web

#### Access Summary
- View own invoices and pay online
- View own payment history and receipts
- Raise and track complaints for own unit
- Add and manage family members
- Register and manage own vehicles
- Create visitor invitations (QR codes)
- Book amenities
- Receive and acknowledge deliveries
- View society announcements
- View own documents

#### Restrictions
- Cannot view other residents' data
- Cannot manage any society-level settings
- Cannot access admin portal features

---

### 7. `TENANT` — Tenant (Renter)

**Scope:** Own unit only (more restricted than owner)  
**Created By:** `SOCIETY_ADMIN` or `RESIDENT` (owner)  
**Login:** Resident Mobile App

#### Access Summary
- View own invoices and pay online (if configured)
- Raise complaints for own unit
- Create visitor invitations
- Receive delivery notifications
- View society announcements

#### Restrictions
- Cannot manage family members (owner manages this)
- Cannot transfer parking
- Cannot access financial reports
- Cannot upload own documents (owner does this)
- Cannot manage amenity bookings (owner manages)

---

### 8. `SECURITY_GUARD` — Security Guard / Gate Staff

**Scope:** Gate-scoped (assigned gate only)  
**Created By:** `SOCIETY_ADMIN` or `FACILITY_MANAGER`  
**Login:** Guard Mobile App (Tablet)

#### Access Summary
- Log visitor entry / exit (scan QR, manual entry)
- Capture visitor photo at gate
- Log delivery arrivals
- View resident directory (name + unit only)
- Log vehicle entry / exit
- Mark staff attendance
- Log security incidents

#### Restrictions
- Cannot view financial data
- Cannot view complaint details
- Cannot manage any settings
- Cannot create or delete records (log only)
- Can only see data from their assigned gate

---

### 9. `VENDOR` — External Vendor / Service Provider

**Scope:** Own vendor profile + contracts + invoices  
**Created By:** `SOCIETY_ADMIN` or `FACILITY_MANAGER`  
**Login:** Vendor Web Portal (limited)

#### Access Summary
- View own contract details
- View own invoices
- Upload own documents (insurance, GST)
- View service schedule for their contract

#### Restrictions
- Cannot view other vendors
- Cannot view residents
- Cannot access any financial society data
- Cannot access any admin features
- Strictly read-only (no data mutation)

---

## Data Scoping Rules

Beyond role-level permissions, all data is filtered by **data scope** to prevent cross-contamination.

### Scope Hierarchy

```
Platform Scope    →  SUPER_ADMIN only
Society Scope     →  SOCIETY_ADMIN, COMMITTEE_MEMBER, ACCOUNTANT, FACILITY_MANAGER
Unit Scope        →  RESIDENT, TENANT
Gate Scope        →  SECURITY_GUARD
Vendor Scope      →  VENDOR
```

### Implementation (TypeORM)

```typescript
// Every query must include society_id filter
// Applied automatically via ScopeInterceptor

// Example repository pattern:
async findAll(user: AuthUser): Promise<Resident[]> {
  return this.repo.find({
    where: { society_id: user.societyId }, // Always scoped
  });
}
```

---

## Role Assignment Rules

| Who Can Assign | Assignable Roles |
|---|---|
| `SUPER_ADMIN` | Any role, including `SOCIETY_ADMIN` |
| `SOCIETY_ADMIN` | `COMMITTEE_MEMBER`, `ACCOUNTANT`, `FACILITY_MANAGER`, `RESIDENT`, `TENANT`, `SECURITY_GUARD`, `VENDOR` |
| `COMMITTEE_MEMBER` | Cannot assign roles |
| Everyone else | Cannot assign roles |

---

## NestJS Implementation Reference

### Role Enum
```typescript
// src/common/enums/role.enum.ts
export enum Role {
  SUPER_ADMIN      = 'super_admin',
  SOCIETY_ADMIN    = 'society_admin',
  COMMITTEE_MEMBER = 'committee_member',
  ACCOUNTANT       = 'accountant',
  FACILITY_MANAGER = 'facility_manager',
  RESIDENT         = 'resident',
  TENANT           = 'tenant',
  SECURITY_GUARD   = 'security_guard',
  VENDOR           = 'vendor',
}
```

### Roles Decorator
```typescript
// src/common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

### Usage on Controller
```typescript
@Get('invoices')
@Roles(Role.SOCIETY_ADMIN, Role.ACCOUNTANT, Role.COMMITTEE_MEMBER)
@UseGuards(JwtAuthGuard, RolesGuard)
findAllInvoices(@CurrentUser() user: AuthUser) {
  return this.billingService.findAll(user);
}
```

---

## JWT Payload Structure

```typescript
interface JwtPayload {
  sub: string;          // user UUID
  email: string;
  role: Role;
  societyId: string;    // null for SUPER_ADMIN
  unitId?: string;      // for RESIDENT, TENANT
  gateId?: string;      // for SECURITY_GUARD
  vendorId?: string;    // for VENDOR
  iat: number;
  exp: number;
}
```

---

*This document is the canonical reference for all role definitions and permission matrices in the Society Management System.*
