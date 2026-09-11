# 🗺️ Society Management System — Phased Rollout Plan

> **Version:** V1  
> **Last Updated:** August 2026  
> **Total Phases:** 3 + Integrations  

---

## Overview

Building all 22 modules simultaneously risks scope creep, delayed launch, and poor product quality. This phased roadmap prioritizes revenue-generating and operationally critical features first, then adds engagement and premium features progressively.

```
Phase 1 (MVP)          Phase 2 (Ops)          Phase 3 (Premium)
─────────────          ──────────────          ─────────────────
Core Foundation    →   Daily Operations    →   Full V1 Feature Set
(Months 1–3)           (Months 4–5)            (Months 6–8)

Cashflow first         Security & Daily         Governance &
Residents next         resident needs           Premium features
Dashboard core         Complaints & gates       Complete analytics
```

---

## Phase 1 — Core Foundation & Cashflow (MVP)

> 🎯 **Goal:** Get a society fully onboarded, collecting maintenance digitally, and tracking their basic financials within weeks of signup.  
> 📅 **Target Duration:** Months 1–3

### Modules Included

| # | Module | Key Deliverables |
|---|---|---|
| 1 | Tenant & Society Management | Multi-tenant setup, society onboarding |
| 2 | Authentication & Users | Login, OTP, JWT sessions, password reset |
| 3 | Roles, Permissions & Data Scope | RBAC, 5 core roles |
| 4 | Society Structure | Society → Tower → Floor → Unit hierarchy |
| 5 | Resident & Family Management | Registration, directory, documents |
| 7 | Maintenance & Billing | Invoice generation, late fees, waivers |
| 8 | Payments & Receipts | UPI, Cards, Cash; auto receipts |
| 9 | Expense & Basic Finance | Expense entry, basic ledger |
| 19 | Notifications | In-app + Email + SMS for payment events |
| 22 | Audit, Settings & Super Dashboard | **Society 360° (Basic)**, settings |

---

### Phase 1 — Feature Detail

#### ✅ Tenant & Society Management
- [x] Multi-tenant architecture setup
- [x] Society registration & onboarding wizard
- [x] Society profile (name, address, registration, GST, logo)
- [x] Plan / subscription management

#### ✅ Authentication & Users
- [x] Email + password login
- [x] Mobile OTP login (mockable via service)
- [x] JWT token management (access + refresh rotation)
- [x] Password reset via email/SMS
- [x] User profile management

#### ✅ Roles & Permissions
- [x] Role definitions: `super_admin`, `society_admin`, `accountant`, `resident`, `tenant`
- [x] Module-level RBAC enforcement (`@Roles`, `RolesGuard`)
- [x] Data scope: society-level isolation (`ScopeGuard`, tenant isolation)

#### ✅ Society Structure
- [x] Society → Tower → Floor → Unit hierarchy
- [x] Unit types (1BHK, 2BHK, 3BHK, etc.)
- [x] Common areas definition & unit status tracking
- [x] Bulk unit import (CSV with strict validation)

#### ✅ Resident & Family Management
- [x] Owner & tenant registration
- [x] Family member management
- [x] Emergency contacts
- [x] Basic document upload & receipt URLs
- [x] Resident directory
- [x] Occupancy history per unit & auto unit status sync

#### ✅ Maintenance & Billing
- [x] Maintenance rule builder (per unit type / sq. ft. / fixed)
- [x] Multiple charge heads
- [x] Billing cycle configuration
- [x] Automatic monthly invoice generation (BullMQ)
- [x] Late fee configuration (flat / %)
- [x] Discount & waiver management
- [x] Invoice PDF export (PDFKit)
- [x] Bulk invoice generation

#### ✅ Payments & Receipts
- [x] Payment gateway integration (Razorpay with mock mode)
- [x] UPI, Cards, Net Banking support
- [x] Cash / Cheque manual entry
- [x] Automatic receipt PDF generation
- [x] Payment reconciliation & invoice status sync
- [x] Outstanding dues dashboard
- [x] Payment confirmation notifications

#### ✅ Expense & Basic Finance
- [x] Expense categories setup
- [x] Expense entry with receipt upload & approval workflow
- [x] Bank account management
- [x] Basic income vs expense ledger
- [x] Monthly financial summary report

#### ✅ Notifications (Phase 1 Scope)
- [x] Invoice generated alert
- [x] Payment received confirmation
- [x] Payment overdue reminder (automated BullMQ)
- [x] Receipt delivery via Email (SendGrid) / SMS (MSG91)

#### ✅ Society 360° Dashboard (Basic)
- [x] Units & occupancy snapshot
- [x] Maintenance collected vs outstanding
- [x] Collection rate KPI
- [x] Recent transactions feed
- [x] Basic attention alerts (overdue invoices, approvals)
- [x] Quick actions (Generate invoices, bulk queues)

---

### Phase 1 — Deliverable

> At the end of Phase 1, a society should be able to:
> - Onboard all residents digitally
> - Generate and send maintenance bills automatically
> - Accept online payments and issue digital receipts
> - Track expenses and basic finances
> - See a real-time financial dashboard

---

## Phase 2 — Security & Daily Operations

> 🎯 **Goal:** Handle the daily operational needs of the society — gates, visitors, complaints, deliveries, and announcements.  
> 📅 **Target Duration:** Months 4–5

### Modules Included

| # | Module | Key Deliverables |
|---|---|---|
| 6 | Vehicles & Parking | Vehicle registration, parking allocation |
| 10 | Complaints & Helpdesk | Full complaint lifecycle with SLA |
| 11 | Visitor Management | QR-based visitor entry & tracking |
| 12 | Security & Gates | Gate management, guard assignment |
| 13 | Delivery Management | Package tracking & notifications |
| 15 | Staff Management | Attendance, shifts, leave |
| 18 | Announcements | Publish notices to targeted residents |
| 19 | Notifications | Expand to push, WhatsApp |
| 22 | Super Dashboard | Expand with Complaints, Visitor, Security KPIs |

---

### Phase 2 — Feature Detail

#### ✅ Vehicles & Parking
- [x] Vehicle registration (car, bike, bicycle, EV)
- [x] Parking slot inventory management
- [x] Parking allocation to units
- [x] Visitor parking management
- [x] Parking availability dashboard
- [x] Parking transfer workflow
- [x] Vehicle verification by admin

#### ✅ Complaints & Helpdesk
- [x] Complaint creation with photo/video
- [x] Category management (10 default categories)
- [x] Priority levels (Low / Medium / High / Critical)
- [x] Staff assignment & reassignment
- [x] Status workflow: Open → Assigned → WIP → Resolved
- [x] Comment thread per complaint
- [x] SLA configuration per category
- [x] Auto-escalation on SLA breach
- [x] Resident resolution confirmation
- [x] Star rating & feedback collection
- [x] Complaint analytics dashboard

#### ✅ Visitor Management
- [x] Resident creates visitor invitation
- [x] System generates QR code + OTP
- [x] Security scans QR at gate
- [x] Visitor photo capture
- [x] Resident notification on visitor arrival
- [x] Walk-in visitor entry (manual)
- [x] Entry & exit time logging
- [x] Visitor vehicle tracking
- [x] Frequent visitor / whitelist
- [x] Blacklist management
- [x] Visitor analytics (daily/weekly/monthly)
- [x] Gate-wise logs

#### ✅ Security & Gates
- [x] Gate management (Main / Back / Emergency)
- [x] Guard assignment to gates
- [x] Shift management
- [x] Emergency / SOS alert system
- [x] Security incident log
- [x] Overnight visitor tracking

#### ✅ Delivery Management
- [x] Delivery logging at gate (courier, food, ecommerce)
- [x] Delivery photo capture
- [x] Push notification to resident: "📦 Package received at Gate 1"
- [x] Resident collection acknowledgement
- [x] Pending vs collected status
- [x] Unattended delivery alerts (after 24 hrs)
- [x] Delivery history per unit

#### ✅ Staff Management
- [x] Staff profile & document management
- [x] Attendance tracking (manual / biometric-ready)
- [x] Shift schedule management
- [x] Leave application & approval
- [x] Basic salary structure
- [x] Work assignment & task tracking

#### ✅ Announcements
- [x] Create announcements (rich text + attachments)
- [x] Target: Society / Tower / Floor / Unit / Role
- [x] Scheduled announcements
- [x] Pinned / priority announcements
- [x] Read / acknowledgement tracking
- [x] Announcement archive

#### ✅ Notifications (Phase 2 Expansion)
- [ ] Push notifications (mobile app)
- [ ] WhatsApp Business API integration
- [ ] Visitor arrival alerts
- [ ] Delivery arrival alerts
- [ ] Complaint status change alerts
- [ ] Announcement push notifications
- [ ] User notification preferences

#### ✅ Society 360° Dashboard (Expanded)
- [x] Complaints / SLA KPI widget
- [x] Visitors today widget
- [x] Deliveries today widget
- [x] Security activity snapshot
- [x] Staff attendance summary
- [x] SLA breach alerts in Attention panel

---

### Phase 2 — Deliverable

> At the end of Phase 2, a society should be able to:
> - Manage all visitor entries digitally with QR codes
> - Track every delivery at the gate with resident notifications
> - Handle complaints end-to-end with SLA tracking
> - Manage all staff attendance and shifts
> - Publish announcements to specific towers / floors
> - See security and operational KPIs on the dashboard

---

## Phase 3 — Premium Features & Complete V1

> 🎯 **Goal:** Deliver the full V1 experience with amenities, vendor/asset management, governance, and complete analytics.  
> 📅 **Target Duration:** Months 6–8

### Modules Included

| # | Module | Key Deliverables |
|---|---|---|
| 14 | Facilities & Amenities | Online bookings with slot management |
| 16 | Vendor Management | Contracts, AMC tracking, payments |
| 17 | Asset Management | Asset register, maintenance schedules |
| 20 | Documents & Records | Central document repository |
| 21 | Meetings, Governance & Reports | AGM, voting, full reports suite |
| 22 | Super Dashboard | Complete with all widgets & filters |

---

### Phase 3 — Feature Detail

#### ✅ Facilities & Amenities
- [x] Amenity profile setup (capacity, location, rules, images)
- [x] Time-slot management
- [x] Online booking by residents
- [x] Booking calendar view
- [x] Booking cancellation & refund
- [x] Booking fees & payment integration
- [x] Per-unit booking limits (per month)
- [x] Admin approval workflow (optional)
- [x] Amenity usage analytics

#### ✅ Vendor Management
- [ ] Vendor profile & contact directory
- [ ] Contract creation (service, start date, end date, value)
- [ ] Contract expiry alerts (30 / 15 / 7 days)
- [ ] Vendor documents (Agreement, GSTIN, Insurance)
- [ ] Vendor invoice tracking
- [ ] Vendor payment processing & history
- [ ] Performance rating & notes
- [ ] AMC schedule tracking

#### ✅ Asset Management
- [ ] Asset register (name, model, serial number, purchase date, cost)
- [ ] Asset categories (Lifts, DG, Pumps, CCTV, etc.)
- [ ] Location mapping to society structure
- [ ] Warranty & AMC tracking with expiry alerts
- [ ] Preventive maintenance schedule
- [ ] Maintenance history log
- [ ] Asset depreciation tracking
- [ ] Asset disposal / write-off workflow
- [ ] Asset photo documentation

#### ✅ Documents & Records
- [ ] Secure document upload & cloud storage
- [ ] Folder hierarchy (Society / Residents / Vendors / Finance)
- [ ] Access control per document / folder
- [ ] Document version history
- [ ] Certificate expiry tracking
- [ ] Search & filter
- [ ] PDF preview in-app
- [ ] Audit trail on document access

#### ✅ Meetings, Governance & Reports
- [ ] Meeting scheduling (AGM, EGM, Committee)
- [ ] Agenda creation & distribution
- [ ] RSVP & attendance tracking
- [ ] Meeting minutes recording
- [ ] Resolution tracking & register
- [ ] Committee member management
- [ ] Online voting / polling for resolutions

**Full Reports Suite:**
| Report | Type |
|---|---|
| Maintenance Collection Report | Financial |
| Outstanding Dues / Aged Debtors | Financial |
| Expense Report (Category-wise) | Financial |
| Income & Expense Statement | Financial |
| Vendor Payment Report | Financial |
| Occupancy Report | Operational |
| Complaint & SLA Report | Operational |
| Visitor Statistics Report | Security |
| Parking Utilization Report | Operational |
| Amenity Usage & Revenue Report | Operational |
| Staff Attendance Report | HR |
| Asset & AMC Status Report | Asset |

#### ✅ Society 360° Dashboard (Complete)
- [ ] All 12 dashboard widgets active
- [ ] Tenant-scoped filters (filter by Tower / Building)
- [ ] Vendor AMC expiry alerts in Attention panel
- [ ] Asset maintenance due alerts
- [ ] Amenity booking summary
- [ ] Document expiry alerts
- [ ] Quick actions: All modules
- [ ] Dashboard customization (widget show/hide)
- [ ] Mobile-responsive dashboard

---

### Phase 3 — Deliverable

> At the end of Phase 3, a society should be able to:
> - Let residents book amenities online and pay
> - Track all vendor contracts and get AMC expiry alerts
> - Maintain a complete asset register with maintenance logs
> - Conduct digital AGMs with online voting
> - Access 12+ detailed reports
> - See a fully loaded Society 360° command center

---

## Integrations Roadmap

> These integrations span across phases and can be added incrementally.

| Integration | Phase | Priority |
|---|---|---|
| Razorpay / Cashfree (Payment Gateway) | Phase 1 | 🔴 Critical |
| SMS Gateway (Twilio / MSG91) | Phase 1 | 🔴 Critical |
| Email (SendGrid / Mailgun) | Phase 1 | 🔴 Critical |
| WhatsApp Business API | Phase 2 | 🟠 High |
| Firebase Push Notifications | Phase 2 | 🟠 High |
| Biometric / Attendance Device | Phase 2 | 🟡 Medium |
| Google Maps (location pin) | Phase 2 | 🟡 Medium |
| Tally / QuickBooks Sync | Phase 3 | 🟡 Medium |
| CCTV / NVR Integration | Phase 3 | 🟡 Medium |
| Boom Barrier / RFID Integration | Phase 3 | 🟡 Medium |
| Fastag Vehicle Detection | Future | 🔵 Low |
| Face Recognition Entry | Future | 🔵 Low |

---

## Interfaces Required

This product requires **three distinct user interfaces**:

| Interface | Users | Platform | Priority |
|---|---|---|---|
| **Admin Web Portal** | Society Admin, Accountant, Committee | Web (React/Next.js) | Phase 1 |
| **Resident Mobile App** | Owners, Tenants, Family Members | iOS + Android | Phase 1 |
| **Guard / Security App** | Security Guards, Gate Staff | Android Tablet/Phone | Phase 2 |

---

## Summary Timeline

```
Month 1       Month 2       Month 3       Month 4       Month 5       Month 6-8
──────────    ──────────    ──────────    ──────────    ──────────    ──────────
 PHASE 1                                  PHASE 2                    PHASE 3
 ────────────────────────────────────     ─────────────────────      ──────────────────
 Auth & Roles  Structure    Maintenance   Visitors     Amenities     Vendors & Assets
 Residents     & Units      Billing &     Complaints   Delivery      Meetings & Reports
               Payments     Finance       Security     Staff Mgmt    Full Dashboard
                            Dashboard     Announce     Parking
                            (Basic)       ments
```

---

## Success Metrics Per Phase

### Phase 1 Metrics
- [ ] Society onboarding time < 2 hours
- [ ] Invoice generation in < 5 minutes for all units
- [ ] Payment collection digitization > 80%
- [ ] Zero missed invoices for configured billing cycles

### Phase 2 Metrics
- [ ] Visitor entry processing time < 30 seconds
- [ ] Complaint response time tracking (SLA compliance > 85%)
- [ ] Security gate adoption rate > 90%
- [ ] Delivery notification delivery rate > 99%

### Phase 3 Metrics
- [ ] Amenity booking digital adoption > 70%
- [ ] Zero missed AMC renewals (vendor expiry alerts working)
- [ ] Report generation time < 10 seconds
- [ ] Dashboard load time < 2 seconds

---

*This phased plan is the canonical delivery roadmap for the Society Management System V1.*
