# 🧠 SMS Project Memory

> **Last Updated:** August 29, 2026
> **Purpose:** Tracks implementation progress, architectural decisions, and next steps for the AI agent.

---

## 📌 Project Overview

**Society Management System (SMS)** — NestJS 11 + TypeORM + PostgreSQL backend.
Three-phase rollout: Phase 1 (MVP/Cashflow) → Phase 2 (Ops/Security) → Phase 3 (Premium).

**Stack:**
- Runtime: Node.js 20 LTS + TypeScript 5
- Framework: NestJS 11
- ORM: TypeORM with PostgreSQL 16
- Queue & Background Jobs: BullMQ with Redis
- PDF Generation: PDFKit
- File Imports: csv-parse (strict validation)
- Auth: JWT access + refresh tokens (HS256), bcrypt hashed, token rotation
- Validation: class-validator + class-transformer (whitelist + forbidNonWhitelisted)
- API Docs: Swagger/OpenAPI 3 at `/api/v1/docs`
- Rate Limiting: `@nestjs/throttler`
- Security: Helmet, CORS with env-based origins, global guard chain

---

## ✅ PHASE 1 MODULES — 100% COMPLETE

### 1. Infrastructure & Cross-cutting ✅
- `main.ts` — Helmet, ValidationPipe, HttpExceptionFilter, LoggingInterceptor, TransformInterceptor, Swagger (all Phase 1 tags), CORS, Rate Limiting
- `AppModule` — ConfigModule (Joi schema for DB, Redis, JWT, Razorpay, SendGrid, MSG91), TypeORM async setup, BullMQ async setup, ThrottlerModule, global guards (Throttler → JwtAuth → Roles)
- `BaseEntity` — UUID PK, `created_at`, `updated_at`, `deleted_at` (soft delete)
- Global decorators: `@Public()`, `@Roles(...)`, `@CurrentUser()`
- RBAC: 9 roles, `ScopeGuard` for society-level data isolation

### 2. Auth Module (`/api/v1/auth`) ✅
- Register, login, refresh token rotation with bcrypt hash storage, single/all logout, account lockout (5 attempts -> 15 min lock), `/me` profile.

### 3. Users Module (`/api/v1/users`) ✅
- Society-scoped CRUD with role assignment constraints.

### 4. Tenants Module (`/api/v1/tenants`) ✅
- SUPER_ADMIN only platform tenant management, subscription tiers (`Plan` enum: free/basic/premium/enterprise), society capacity validation.

### 5. Societies Module (`/api/v1/societies`) ✅
- Housing society profiles, GST format check, JSONB address & settings, denormalized tower/unit counts with auto-sync.

### 6. Society Structure Module (`/api/v1/societies/:societyId/...`) ✅
- Entities: `Tower`, `Floor`, `Unit`
- Enums: `UnitType` (1bhk, 2bhk, 3bhk, 4bhk, studio, shop, office, penthouse, commercial), `UnitStatus` (vacant, occupied, under_renovation, locked)
- Nested REST endpoints: `/towers`, `/floors`, `/units`
- **CSV Bulk Import:** `POST /units/import` with strict validation (fails entire batch on any row error)

### 7. Residents & Family Module (`/api/v1/residents`) ✅
- Entities: `Resident` (links User ↔ Unit), `FamilyMember`
- Enums: `ResidentType` (owner, tenant)
- Auto-syncs Unit status to `occupied`/`vacant` on move-in/move-out
- Public-facing resident directory (`GET /residents/directory`)
- Family members CRUD with emergency contact flags

### 8. Maintenance & Billing Module (`/api/v1/maintenance`) ✅
- Entities: `MaintenanceHead`, `BillingRule`, `LateFeeConfig`, `Invoice`
- Enums: `BillingRuleType` (per_unit, per_sqft, fixed), `InvoiceStatus` (draft, pending, paid, overdue, waived, partially_paid)
- Monthly invoice calculation engine based on rules & unit sq. ft./type
- Waiver / discount management (`PATCH /invoices/:id/waive`)
- PDF invoice generation via `PdfService` (PDFKit)
- BullMQ `billing` queue & `BillingScheduler` worker:
  - Monthly repeatable auto-generation
  - Daily overdue detection & late-fee application

### 9. Payments & Receipts Module (`/api/v1/payments`) ✅
- Entities: `Payment`
- Enums: `PaymentMethod` (upi, card, netbanking, cash, cheque, bank_transfer), `PaymentStatus` (pending, success, failed, refunded)
- Online payment: Razorpay order generation & webhook verification with mock fallback mode (`RAZORPAY_MOCK=true`)
- Manual payment: Cash / cheque recording (ACCOUNTANT+)
- Automatic invoice status sync to `PAID` upon payment confirmation
- Automatic receipt numbering (`RCP-YYYY-NNNN`)
- PDF receipt generation (`GET /payments/:id/receipt`)
- Outstanding dues query (`GET /payments/outstanding`)

### 10. Expenses & Basic Finance Module (`/api/v1/expenses`, `/api/v1/finance`) ✅
- Entities: `ExpenseCategory`, `Expense`, `BankAccount`
- Expense creation with approval workflow (`PATCH /expenses/:id/approve` by SOCIETY_ADMIN+)
- Bank accounts tracking with primary account designation
- Monthly income vs expense breakdown (`GET /finance/summary`)

### 11. Notifications Module (`/api/v1/notifications`) ✅
- Entities: `Notification`
- Enums: `NotificationType`, `NotificationChannel` (in_app, email, sms), `NotificationStatus`
- BullMQ `notifications` queue & `NotificationsProcessor` worker
- **Email:** `EmailService` integrating SendGrid with mock fallback mode
- **SMS:** `SmsService` integrating MSG91 Flow API with native fetch & mock fallback mode
- In-app notification feed, read tracking, unread count badge API

### 12. Society 360° Dashboard Module (`/api/v1/dashboard`) ✅
- `GET /dashboard/summary` — total & occupied units, occupancy rate, current month billed vs collected, collection rate, expenses, net balance
- `GET /dashboard/alerts` — overdue invoices count, vacant units count, pending expense approvals
- `GET /dashboard/recent-activity` — unified recent payments and expenses stream

---

## ✅ PHASE 2 MODULES — IN PROGRESS

### 13. Complaints & Helpdesk Module (`/api/v1/complaints`) ✅
- Entities: `Complaint`, `ComplaintComment`, `SlaConfig`
- Enums: `ComplaintStatus` (open, assigned, in_progress, resolved, closed, escalated), `ComplaintPriority` (low/medium/high/critical), `ComplaintCategory` (10 categories)
- Forward-only status transition enforcement via `COMPLAINT_STATUS_TRANSITIONS` map
- Role-scoped queries: residents see own unit only; admins see all society complaints
- Assignment with automatic SLA deadline calculation from `SlaConfig`
- Comment threads with `isInternal` flag (hidden from residents)
- Resident close + star rating (1–5) + feedback
- BullMQ `sla-queue` with 30-minute repeatable job for auto-escalation
- Escalation notifies society admin via `NotificationsService.send()`
- Analytics endpoint: count by status/priority/category, avg resolution hours, escalated count
- Migration: `1724000000003-CreateComplaints.ts`

### 14. Visitor & Gate Management Module (`/api/v1/visitors`, `/api/v1/gates`, `/api/v1/security-incidents`) ✅
- Entities: `Gate`, `GateAssignment`, `Visitor`, `VisitorLog`, `SecurityIncident`
- Enums: `GateType`, `VisitorType`, `VisitorStatus`, `IncidentType`, `IncidentSeverity`, `IncidentStatus`
- Physical gate CRUD & guard shift assignment
- Resident pre-approved invitations with auto-generated 6-digit OTP passcode & QR token
- Guard walk-in entry registration & instant host notification via `NotificationsService`
- Guard verification endpoint `GET /visitors/verify/:code`
- Entry/Exit logging in `visitor_logs` with gate timestamps, photo URLs, and vehicle numbers
- Blacklisting system with entry rejection
- Security incident & SOS panic alert reporting & resolution
- Real-time visitor analytics (inside now, today entries, walk-in vs pre-approved)
- Migration: `1724000000012-CreateVisitorsAndGates.ts`

### 15. Delivery & Parcel Management Module (`/api/v1/deliveries`) ✅
- Entities: `Delivery`
- Enums: `DeliveryType` (courier, food, ecommerce, grocery, documents, medicine, other), `DeliveryStatus` (pending_pickup, delivered_to_unit, collected, returned, cancelled)
- Guard delivery logging at gate with package photo URL, courier company, and recipient unit
- Auto-generation of secure 6-digit pickup OTP / resident passcodes
- Immediate notification to unit residents upon package arrival (In-App / SMS / Email)
- Resident pre-approval pass creation
- Role-scoped queries: residents see only their unit's deliveries; guards and admins see society-wide with phone number privacy masking
- Pickup verification endpoint: `POST /deliveries/:id/verify-otp` and collection handover `POST /deliveries/:id/collect`
- Direct access permission (`POST /deliveries/:id/allow-entry`) for food/grocery delivery partners
- BullMQ `deliveries` queue with 1-hour repeatable job scanning for unattended packages (> 24 hours at gate) and triggering reminders
- Gate delivery analytics (today total, pending pickup, collected today, direct entry, breakdown by type)
- Migration: `1724000000013-CreateDeliveries.ts`

### 16. Staff & Domestic Help Module (`/api/v1/staff`) ✅
- Entities: `StaffMember`, `StaffAttendance`, `StaffShift`, `StaffLeave`, `StaffTask`
- Enums: `StaffType` (11 types incl. `domestic_help`), `ShiftType`, `StaffStatus`, `AttendanceStatus`, `LeaveType`, `LeaveStatus`
- Auto-generated `staffCode` (`STF-YYYY-NNNN`) on profile creation
- Aadhaar number stored for admin; masked (`XXXX-XXXX-1234`) in all API responses
- `isDomesticHelp` flag cleanly distinguishes full-time employees from part-time domestic helpers
- Background document storage: Police Verification, Aadhaar doc, ID proof URLs
- Daily attendance marking by Security Guards OR Facility Managers with optional gate reference
- Bulk attendance endpoint: guard marks all shift staff at once (`POST /staff/attendance/bulk`)
- Full shift schedule CRUD with `effectiveFrom`/`effectiveTo` dates
- Leave lifecycle: apply → pending → approve/reject with duplicate-date guards and notification
- Work task assignment with completion tracking and completion notes
- Staff KPI dashboard: active count, domestic help count, today's present/absent/on-leave, pending leaves, open tasks, breakdown by type
- Society-wide attendance report grouped by date with present/absent/halfDay/onLeave aggregates
- NotificationsService integration: LEAVE_REQUEST, LEAVE_APPROVED, LEAVE_REJECTED events
- RBAC: Admin/FacilityManager = full access; SecurityGuard = attendance only; CommitteeMember = read-only
- 25 unit tests (service + controller)
- Migration: `1724000000014-CreateStaff.ts`

### 17. Notice Board & Announcements Module (`/api/v1/announcements`) ✅
- Entities: `Announcement`, `AnnouncementRead`
- Enums: `AnnouncementType` (9 types incl. water_shutdown, electricity_shutdown, emergency, circular), `AnnouncementStatus` (draft, scheduled, published, archived), `AnnouncementPriority` (low, normal, high, urgent), `AnnouncementTargetScope` (society, tower, floor, unit, role_group), `AnnouncementTargetRole`
- Draft creation with HTML sanitization (`sanitize-html`) allowing safe markup & attributes
- Immediate publish or scheduled publish via BullMQ (`announcements` queue) with delayed jobs
- Daily 2:00 AM archive sweep job via BullMQ job scheduler for auto-expiring announcements
- Read tracking with per-user read receipt & idempotent read marking (`POST /announcements/:id/read`)
- Real-time unread badge count (`GET /announcements/unread-count`)
- Pin/unpin priority notice board features (`PATCH /announcements/:id/pin`)
- Role-scoped feed queries (residents see published only; pinned items ordered first)
- NotificationsService integration: automated broadcast on announcement publishing
- 30 unit tests (service + controller)
- Migration: `1724000000015-CreateAnnouncements.ts`

---

## 🏗️ KEY ARCHITECTURAL DECISIONS

| Decision | Choice | Reason |
|---|---|---|
| Global guard order | Throttler → JwtAuth → Roles | Rate limit first, then auth, then RBAC |
| Soft deletes | `@DeleteDateColumn` (TypeORM) | Audit trail, reversible |
| Password hashing | bcrypt salt 12 | Industry standard |
| Refresh token storage | Hashed (bcrypt salt 10) in DB with expiry + revocation | Secure, revocable, rotated |
| Multi-tenant isolation | `societyId` on every entity, enforced by ScopeGuard | Platform-level isolation |
| Background queues | BullMQ with Redis | Async invoice generation & decoupled notifications |
| PDF generation | PDFKit via PdfService | Fast in-memory buffer generation for invoices and receipts |
| CSV import | csv-parse in strict mode | Transactional integrity: prevents dirty partial imports |
| Database & entity changes | Mandatory TypeORM migrations (`synchronize: false`) | Zero drift, production safety, auditability, reversible schema |
| Gateways integration | Mock fallback mode (RAZORPAY_MOCK, SENDGRID_API_KEY, MSG91_AUTH_KEY) | Seamless local development without live API keys |

---

## 🚀 NEXT IN PHASE 2

1. ~~**Notice Board & Announcements Module** (`/announcements`)~~ ✅ Complete
2. **Vehicle & Parking Management Module** (`/vehicles`, `/parking`) — Slot allocation, RFID/number plate tracking
3. **Facility & Amenity Booking Module** (`/facilities`, `/bookings`) — Slot booking, hourly/daily rates, cancellation policy


