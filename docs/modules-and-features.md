# 🏛️ Society Management System — Modules & Features (V1)

> **Version:** V1  
> **Last Updated:** August 2026  
> **Total Modules:** 22  

---

## Table of Contents

1. [Tenant & Society Management](#1-tenant--society-management)
2. [Authentication & Users](#2-authentication--users)
3. [Roles, Permissions & Data Scope](#3-roles-permissions--data-scope)
4. [Society Structure](#4-society-structure)
5. [Resident & Family Management](#5-resident--family-management)
6. [Vehicles & Parking](#6-vehicles--parking)
7. [Maintenance & Billing](#7-maintenance--billing)
8. [Payments & Receipts](#8-payments--receipts)
9. [Expense & Basic Finance](#9-expense--basic-finance)
10. [Complaints & Helpdesk](#10-complaints--helpdesk)
11. [Visitor Management](#11-visitor-management)
12. [Security & Gates](#12-security--gates)
13. [Delivery Management](#13-delivery-management)
14. [Facilities & Amenities](#14-facilities--amenities)
15. [Staff Management](#15-staff-management)
16. [Vendor Management](#16-vendor-management)
17. [Asset Management](#17-asset-management)
18. [Announcements](#18-announcements)
19. [Notifications](#19-notifications)
20. [Documents & Records](#20-documents--records)
21. [Meetings, Governance & Reports](#21-meetings-governance--reports)
22. [Audit, Settings & Super Dashboard](#22-audit-settings--super-dashboard)

---

## 1. Tenant & Society Management

Manages the top-level entity — a registered society or housing complex — in a multi-tenant architecture.

### Features
- Multi-tenant architecture (one deployment, multiple societies)
- Society onboarding & registration
- Subscription & plan management
- Tenant isolation (data scoping per society)
- Society profile configuration
- Billing & invoicing per tenant (SaaS billing)

---

## 2. Authentication & Users

Handles all user identity, login, and session management across roles.

### Features
- Email & password login
- OTP-based mobile authentication
- Social login (Google)
- JWT-based session management
- Password reset & account recovery
- Two-Factor Authentication (2FA)
- Session expiry & multi-device management
- User profile management
- Account deactivation / deletion

---

## 3. Roles, Permissions & Data Scope

Defines what each user can see and do within the system.

### Roles
| Role | Description |
|---|---|
| `super_admin` | Platform-level access across all societies |
| `society_admin` | Full control within their society |
| `committee_member` | Elevated resident with approval rights |
| `resident` / `owner` | Self-service resident access |
| `tenant` | Limited resident access |
| `security_guard` | Gate & visitor management only |
| `staff` | Task & attendance specific |
| `vendor` | Invoice & contract view |
| `accountant` | Finance-only access |

### Features
- Role-based access control (RBAC)
- Fine-grained permission matrix (create / read / update / delete per module)
- Data scope enforcement (tower-level, floor-level, unit-level)
- Role assignment & revocation
- Custom role creation

---

## 4. Society Structure

Defines the physical hierarchy and layout of the society.

### Hierarchy
```
Society
 └── Tower / Building
      └── Floor
           └── Flat / Unit
                └── Unit Type
```

### Features
- Society profile (name, registration number, address, GST, logo)
- Tower / Building management
- Floor management
- Flat / Unit management
- Unit types (1BHK, 2BHK, 3BHK, Penthouse, Studio, Commercial)
- Common areas (Lobby, Terrace, Basement, Garden)
- Amenity mapping to structure
- Society documents (Bye-laws, NOC, Registration Certificate)
- Society-level settings & configuration

---

## 5. Resident & Family Management

Manages all people living within the society.

### Sub-Modules

#### 5.1 Resident Registration
- Owner registration & verification
- Tenant registration & verification
- Resident directory
- Resident status (Active / Inactive / Moved-out)
- Occupancy history per unit

#### 5.2 Family Members
- Add / manage family members per resident
- Relationship tagging (Spouse, Child, Parent, etc.)
- Member-level access rights

#### 5.3 Emergency Contacts
- Multiple emergency contacts per resident
- Contact type (Medical, Police, Personal)

#### 5.4 Resident Documents
- ID proof (Aadhaar, PAN, Passport)
- Rental agreement (for tenants)
- NOC documents
- Move-in / Move-out records

#### 5.5 Move-in / Move-out Workflow
- Checklist-based onboarding
- Security deposit tracking
- Gate pass generation for move-out
- NOC generation

---

## 6. Vehicles & Parking

Manages all vehicles registered by residents and their parking allocations.

### Features

#### 6.1 Vehicle Management
- Vehicle registration (car, bike, bicycle, EV)
- Vehicle types & categories
- Vehicle documents (RC, Insurance)
- Vehicle verification by admin
- Vehicle status (Active / Inactive)

#### 6.2 Parking Management
- Parking slot inventory
- Parking slot types (Covered, Open, EV-charging)
- Parking allocation to residents / units
- Parking transfer between residents
- Parking availability dashboard
- Visitor parking slots
- Parking fee configuration

---

## 7. Maintenance & Billing

Core financial module handling recurring charges for all units.

### Features

#### 7.1 Maintenance Rules
- Rule-based invoice generation (per unit type, per area)
- Flat-rate or square-footage-based billing
- Multiple charge heads (Maintenance, Sinking Fund, Water, etc.)
- Billing cycle configuration (Monthly, Quarterly, Annual)

#### 7.2 Invoice Management
- Automatic invoice generation
- Invoice line items
- Due date configuration
- Late fee rules (flat or percentage-based)
- Discounts & waivers
- Invoice preview & PDF export

#### 7.3 Payment Tracking
- Payment status per invoice (Pending / Partial / Paid / Overdue)
- Payment history per unit
- Outstanding dues report
- Bulk payment reminders

---

## 8. Payments & Receipts

Handles all incoming payment transactions.

### Supported Payment Modes
| Mode | Support |
|---|---|
| UPI | ✅ |
| Credit / Debit Cards | ✅ |
| Net Banking | ✅ |
| Bank Transfer (NEFT/RTGS) | ✅ |
| Cash | ✅ (Manual entry) |
| Cheque | ✅ (Manual entry) |

### Features
- Payment gateway integration (Razorpay / PayU / Cashfree)
- Automatic receipt generation (PDF)
- Partial payment support
- Payment reconciliation
- Refund processing
- Payment confirmation notifications (SMS / Email / WhatsApp)
- Transaction history per unit

---

## 9. Expense & Basic Finance

Tracks all outgoing expenses and maintains basic accounting.

### Features

#### 9.1 Expense Management
- Expense categories (Electricity, Water, Cleaning, Repairs, Salaries)
- Manual expense entry
- Expense approval workflow
- Expense receipts / attachments

#### 9.2 Bank Accounts
- Multiple bank account management
- Account-level ledger
- Opening & closing balance

#### 9.3 Budgets
- Annual budget creation
- Budget vs Actual comparison
- Category-level budget limits

#### 9.4 Ledger & Reports
- Income ledger
- Expense ledger
- Vendor payment ledger
- Monthly & annual financial summary
- Export to Excel / PDF

---

## 10. Complaints & Helpdesk

Manages resident complaints and tracks resolution with SLA monitoring.

### Resident Workflow
```
Create Complaint → Assign → Work in Progress → Resolved → Rating
```

### Features

#### 10.1 Complaint Categories
- Plumbing
- Electrical
- Lift / Elevator
- Security
- Housekeeping / Cleaning
- Parking
- Water Supply
- Structural
- Internet / CCTV
- Other

#### 10.2 Complaint Management
- Complaint creation with photo/video attachment
- Priority levels (Low / Medium / High / Critical)
- Assignment to staff or vendor
- Status tracking & comments thread
- SLA configuration per category
- Escalation rules (auto-escalate on SLA breach)
- Resolution confirmation by resident
- Star rating & feedback
- Complaint analytics & reports

---

## 11. Visitor Management

Manages all incoming visitors to the society with digital verification.

### Resident Workflow
```
Add Visitor → Generate QR / OTP Code → Share with Visitor
```

### Security Workflow
```
Visitor Arrives → Scan QR / Enter Code → Verify → Allow Entry → Log Exit
```

### Features
- Pre-approved visitor invitations
- QR code & OTP-based entry
- Walk-in visitor entry (without pre-approval)
- Visitor photo capture at gate
- Host resident notification on arrival
- Visitor entry / exit time logging
- Visitor vehicle tracking
- Frequent visitor / whitelist management
- Blacklist management
- Visitor analytics (daily / weekly / monthly)
- Gate-wise visitor logs

---

## 12. Security & Gates

Manages gate operations and security personnel activities.

### Features
- Gate management (Main Gate, Back Gate, Emergency Gate)
- Gate-wise access logs
- Security guard assignment to gates
- Shift management for guards
- Emergency / panic alert system
- CCTV integration (future)
- Boom barrier / RFID integration (future)
- Overnight visitor tracking
- Security incident logging

---

## 13. Delivery Management

Tracks all deliveries arriving at the gate for residents.

### Delivery Types
- Courier / Parcel
- Food Delivery (Zomato, Swiggy)
- E-commerce (Amazon, Flipkart)
- Grocery (Blinkit, Zepto)
- Documents
- Other

### Features
- Delivery logging at gate by security
- Delivery photo capture
- Resident notification: **"📦 Package received at Gate 1"**
- Delivery acknowledgement by resident
- Pending / collected delivery tracking
- Delivery history per unit
- Unattended delivery alerts

---

## 14. Facilities & Amenities

Manages bookable amenities within the society.

### Common Amenities
- Clubhouse
- Swimming Pool
- Gymnasium / Gym
- Party Hall / Banquet
- Tennis Court
- Badminton Court
- Community Hall
- Terrace / Rooftop
- BBQ Area

### Features
- Amenity profile (capacity, location, rules)
- Slot / time-block management
- Online booking by residents
- Booking cancellation
- Booking fees & charges
- Capacity limits
- Booking limits per unit (per month)
- Admin approval workflow (optional)
- Booking calendar view
- Amenity usage reports

---

## 15. Staff Management

Manages all society employees.

### Staff Types
- Security Guards
- Housekeeping Staff
- Gardeners
- Electricians / Plumbers
- Maintenance Staff
- Society Manager / Facility Manager

### Features
- Staff profile & documents (ID, Police Verification)
- Attendance tracking (Biometric / Manual)
- Shift management (Morning, Evening, Night)
- Leave management
- Salary structure & payroll
- Work assignment & task tracking
- Performance notes
- Joining & exit records

---

## 16. Vendor Management

Manages third-party service providers contracted by the society.

### Vendor Types
- Lift / Elevator AMC Vendor
- CCTV / Security Systems
- Cleaning / Housekeeping Agency
- Electrical Contractor
- Plumbing Contractor
- Landscaping / Gardening
- Pest Control
- Fire Safety
- Internet / Cable Provider

### Features
- Vendor profile & contact details
- Contract management (start date, end date, value)
- Contract expiry alerts (30 / 15 / 7 days before expiry)
- Service category tagging
- Vendor documents (Agreement, GSTIN, Insurance)
- Invoice tracking from vendors
- Vendor payments & payment history
- Performance rating & notes
- Vendor directory

#### Example Contract Record
```
Vendor:      LiftCo India Pvt. Ltd.
Service:     Lift AMC
Contract:    01 Jan 2026 → 31 Dec 2026
Annual Cost: ₹3,00,000
Status:      Active
Expiry Alert: ⚠ 18 days remaining
```

---

## 17. Asset Management

Tracks all physical assets owned by the society.

### Asset Categories
- Lifts / Elevators
- Generators (DG Sets)
- Pumps & Motors
- CCTV Cameras
- Fire Safety Equipment
- Gym Equipment
- Common Area Furniture
- Electrical Panels
- Water Tanks

### Features
- Asset register (name, model, serial number, purchase date)
- Asset location mapping
- Warranty & AMC tracking
- Maintenance schedule
- Maintenance history log
- Asset depreciation tracking
- Asset disposal / write-off
- Asset photo documentation

---

## 18. Announcements

Enables the society to publish notices and updates to residents.

### Announcement Types
- General Notices
- Circulars
- Emergency Announcements
- Event Invitations
- Maintenance Notices
- Water Shutdown Notices
- Electricity Shutdown Notices
- AGM / Meeting Notices

### Targeting Options
| Target | Description |
|---|---|
| Entire Society | All residents |
| Tower / Building | Specific tower |
| Floor | Specific floor |
| Unit | Specific flat |
| Role Group | Owners only / Tenants only |

### Features
- Rich text announcement creation
- Attachment support (PDF, Image)
- Scheduled publishing
- Acknowledgement tracking (Read / Unread)
- Pinned / priority announcements
- Announcement archive
- Push notification on publish

---

## 19. Notifications

Central notification engine delivering alerts across all modules.

### Channels
| Channel | Usage |
|---|---|
| In-App | All modules |
| Push Notification | Mobile app |
| SMS | OTP, critical alerts |
| Email | Invoices, receipts, reports |
| WhatsApp | Visitor arrival, delivery alerts |

### Notification Types
- Maintenance invoice generated
- Payment received / overdue reminder
- Complaint status update
- Visitor arrival at gate
- Delivery received at gate
- Amenity booking confirmation
- Announcement published
- Contract / AMC expiry alert
- SLA breach alert
- Emergency alert

### Features
- Notification preferences per user (opt-in/out per type)
- Notification history & read status
- Bulk notification broadcasting
- Template management
- Delivery status tracking

---

## 20. Documents & Records

Central repository for all society and resident documents.

### Document Categories
- Society Documents (Registration, Bye-laws, NOC)
- Resident Documents (ID, Rental Agreement)
- Vendor Contracts
- Audit Reports
- Financial Statements
- Meeting Minutes
- Compliance Certificates

### Features
- Secure document upload & storage
- Folder hierarchy organization
- Access control per document
- Document version history
- Expiry date tracking (for certificates)
- Search & filter
- PDF preview & download
- Audit trail on document access

---

## 21. Meetings, Governance & Reports

Manages formal society meetings and governance activities.

### Meeting Types
- Annual General Meeting (AGM)
- Extraordinary General Meeting (EGM)
- Managing Committee Meeting
- Emergency Meeting

### Features

#### 21.1 Meetings
- Meeting scheduling & agenda creation
- Attendee management & RSVP
- Meeting minutes recording
- Resolution tracking
- Meeting documents (Agenda, Minutes PDF)
- Meeting notifications

#### 21.2 Governance
- Committee member management
- Voting / polling system (for resolutions)
- Resolution register

#### 21.3 Reports
| Report | Description |
|---|---|
| Maintenance Collection | Collected vs Outstanding |
| Outstanding Dues | Aged debtors report |
| Expense Report | Category-wise expenses |
| Income Statement | Monthly/Annual P&L |
| Vendor Payments | Payments made to vendors |
| Occupancy Report | Occupied vs Vacant units |
| Complaint Report | Status, SLA, category-wise |
| Visitor Statistics | Daily / weekly / monthly |
| Parking Report | Allocation & utilization |
| Amenity Usage | Booking frequency & revenue |

---

## 22. Audit, Settings & Super Dashboard

### 22.1 Audit Logs
- Complete activity log for all user actions
- Timestamped records (who did what, when)
- Module-wise audit trail
- Export audit logs

### 22.2 Settings
- Society-level settings
- Module enable / disable per society
- Notification template configuration
- Maintenance rule configuration
- SLA configuration
- Late fee configuration
- Payment gateway configuration
- SMTP / SMS / WhatsApp API configuration

### 22.3 Super Dashboard — Society 360°

The command center for society administrators.

```
╔══════════════════════════════════════════════════════╗
║                   SOCIETY 360°                       ║
╠══════════════════════════════════════════════════════╣
║  UNITS              850    OCCUPIED    792           ║
║                            VACANT       58           ║
╠══════════════════════════════════════════════════════╣
║  MAINTENANCE                                         ║
║  Collected          ₹18.4L   Outstanding   ₹2.1L   ║
║  Collection Rate    91%                              ║
╠══════════════════════════════════════════════════════╣
║  COMPLAINTS                                          ║
║  Open               24       Critical        3       ║
╠══════════════════════════════════════════════════════╣
║  TODAY                                               ║
║  Visitors           186      Deliveries      92      ║
╠══════════════════════════════════════════════════════╣
║  EXPENSES THIS MONTH          ₹8.2L                 ║
╠══════════════════════════════════════════════════════╣
║  ⚠ ATTENTION REQUIRED                               ║
║  🔴  3 unresolved critical complaints               ║
║  🟠  12 maintenance payments overdue > 30 days      ║
║  🟠  Lift AMC expires in 18 days                    ║
║  🟢  Collection rate at 91% — on target             ║
╚══════════════════════════════════════════════════════╝
```

#### Dashboard Widgets
| Widget | Description |
|---|---|
| Society Snapshot | Units, occupancy, vacant count |
| Financial KPIs | Collected, outstanding, collection rate |
| Maintenance Summary | Invoice status, overdue aging |
| Complaints / SLA | Open, critical, SLA breaches |
| Security & Visitors | Today's visitors, gate activity |
| Facilities | Bookings today, upcoming |
| Operations | Staff attendance, pending tasks |
| Communication | Unread announcements, pending notices |
| Documents | Expiring certificates, pending uploads |
| Alerts Panel | Smart alerts requiring attention |
| Quick Actions | One-click shortcuts to common tasks |
| Tenant Filters | Filter dashboard by tower / building |

---

## Summary Matrix

| # | Module | Priority | Complexity |
|---|---|---|---|
| 1 | Tenant & Society Management | 🔴 Critical | High |
| 2 | Authentication & Users | 🔴 Critical | Medium |
| 3 | Roles, Permissions & Data Scope | 🔴 Critical | High |
| 4 | Society Structure | 🔴 Critical | Medium |
| 5 | Resident & Family Management | 🔴 Critical | Medium |
| 6 | Vehicles & Parking | 🟠 High | Medium |
| 7 | Maintenance & Billing | 🔴 Critical | High |
| 8 | Payments & Receipts | 🔴 Critical | High |
| 9 | Expense & Basic Finance | 🟠 High | Medium |
| 10 | Complaints & Helpdesk | 🟠 High | Medium |
| 11 | Visitor Management | 🟠 High | Medium |
| 12 | Security & Gates | 🟠 High | Medium |
| 13 | Delivery Management | 🟡 Medium | Low |
| 14 | Facilities & Amenities | 🟡 Medium | Medium |
| 15 | Staff Management | 🟠 High | Medium |
| 16 | Vendor Management | 🟠 High | Medium |
| 17 | Asset Management | 🟡 Medium | Medium |
| 18 | Announcements | 🟡 Medium | Low |
| 19 | Notifications | 🔴 Critical | Medium |
| 20 | Documents & Records | 🟡 Medium | Low |
| 21 | Meetings, Governance & Reports | 🟡 Medium | Medium |
| 22 | Audit, Settings & Super Dashboard | 🔴 Critical | High |

---

*This document is the canonical reference for the Society Management System V1 feature specification.*
