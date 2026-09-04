# 🏗️ System Architecture — Society Management System

> **Version:** V1  
> **Last Updated:** August 2026  
> **Stack:** NestJS · TypeORM · PostgreSQL · Redis · BullMQ  

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Runtime** | Node.js 20 LTS | Server runtime |
| **Framework** | NestJS 11 | Backend framework (modules, DI, decorators) |
| **Language** | TypeScript 5 | Type-safe development |
| **ORM** | TypeORM | Database abstraction + migrations |
| **Database** | PostgreSQL 16 | Primary relational database |
| **DB Admin** | pgAdmin 4 | Database GUI management |
| **Cache** | Redis 7 | Session store, rate limiting, job queue |
| **Job Queue** | BullMQ | Background jobs (notifications, invoices) |
| **Auth** | JWT (HS256 / RS256) | Stateless authentication |
| **Validation** | class-validator + class-transformer | DTO validation |
| **API Docs** | Swagger / OpenAPI 3 | Auto-generated API documentation |
| **File Storage** | AWS S3 / Cloudflare R2 | Document & image storage |
| **Email** | SendGrid / Mailgun | Transactional emails |
| **SMS** | MSG91 / Twilio | OTP and alerts |
| **WhatsApp** | Meta WhatsApp Business API | Visitor & delivery alerts |
| **Payments** | Razorpay / Cashfree | Payment gateway |
| **Testing** | Jest | Unit & integration tests |
| **Linting** | ESLint + Prettier | Code quality |
| **Process Manager** | PM2 | Production process management |

---

## High-Level Architecture

```
                        ┌─────────────────────────────────────────────┐
                        │              CLIENT INTERFACES               │
                        │                                             │
                        │  Admin Web      Resident App   Guard App   │
                        │  (Next.js)      (React Native) (Android)   │
                        └────────────────────┬────────────────────────┘
                                             │ HTTPS / REST API
                                             │
                        ┌────────────────────▼────────────────────────┐
                        │              API GATEWAY / NGINX             │
                        │  - SSL Termination                          │
                        │  - Rate Limiting (nginx-limit-req)          │
                        │  - Load Balancing                           │
                        └────────────────────┬────────────────────────┘
                                             │
                        ┌────────────────────▼────────────────────────┐
                        │            NestJS APPLICATION SERVER         │
                        │                                             │
                        │  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
                        │  │  Guards  │  │  Pipes   │  │Interceptors│ │
                        │  │ JWT Auth │  │Validation│  │Scope/Log │ │
                        │  │ RolesGrd │  │Transform │  │          │ │
                        │  └──────────┘  └──────────┘  └──────────┘ │
                        │                                             │
                        │  ┌─────────────────────────────────────┐   │
                        │  │            MODULES (22)              │   │
                        │  │  Auth │ Users │ Residents │ Billing  │   │
                        │  │  Complaints │ Visitors │ Payments   │   │
                        │  │  ...and 15 more modules              │   │
                        │  └─────────────────────────────────────┘   │
                        └──────┬──────────────┬────────────────┬──────┘
                               │              │                │
               ┌───────────────▼──┐   ┌───────▼──────┐  ┌────▼──────────┐
               │   PostgreSQL 16  │   │    Redis 7   │  │   BullMQ      │
               │   (Primary DB)   │   │  Cache/Queue │  │  Job Worker   │
               │                  │   │  Rate Limit  │  │  Notifications│
               │  sms_production  │   │  Sessions    │  │  Invoices     │
               └──────────────────┘   └──────────────┘  └───────────────┘
```

---

## Project Directory Structure

```
sms/
├── src/
│   ├── app.module.ts                    # Root module
│   ├── main.ts                          # Application bootstrap
│   │
│   ├── common/                          # Shared utilities
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts       # @Roles() decorator
│   │   │   ├── current-user.decorator.ts # @CurrentUser() decorator
│   │   │   └── public.decorator.ts      # @Public() — skip auth
│   │   ├── enums/
│   │   │   ├── role.enum.ts             # Role enum definitions
│   │   │   └── status.enum.ts           # Common status enums
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts        # JWT validation guard
│   │   │   ├── roles.guard.ts           # RBAC guard
│   │   │   └── scope.guard.ts           # Data scope enforcement
│   │   ├── interceptors/
│   │   │   ├── scope.interceptor.ts     # Auto-inject societyId filter
│   │   │   ├── transform.interceptor.ts # Response wrapper
│   │   │   └── logging.interceptor.ts   # Request logging
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts # Global error handler
│   │   ├── pipes/
│   │   │   └── parse-uuid.pipe.ts       # UUID validation pipe
│   │   ├── dto/
│   │   │   └── pagination.dto.ts        # Shared pagination DTO
│   │   └── interfaces/
│   │       └── auth-user.interface.ts   # AuthUser interface from JWT
│   │
│   ├── config/                          # Configuration
│   │   ├── database.config.ts           # TypeORM config
│   │   ├── jwt.config.ts                # JWT config
│   │   ├── redis.config.ts              # Redis config
│   │   └── app.config.ts                # App-level config
│   │
│   ├── database/                        # Database layer
│   │   ├── migrations/                  # TypeORM migration files
│   │   │   ├── 1724000000000-CreateTenants.ts
│   │   │   ├── 1724000000001-CreateUsers.ts
│   │   │   ├── 1724000000002-CreateSocieties.ts
│   │   │   └── ...
│   │   └── seeds/                       # Database seed data
│   │       ├── super-admin.seed.ts
│   │       └── roles.seed.ts
│   │
│   ├── modules/                         # Feature modules (22)
│   │   ├── auth/                        # Authentication
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── local.strategy.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       └── refresh-token.dto.ts
│   │   │
│   │   ├── users/                       # User management
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── entities/
│   │   │   │   └── user.entity.ts
│   │   │   └── dto/
│   │   │       ├── create-user.dto.ts
│   │   │       └── update-user.dto.ts
│   │   │
│   │   ├── tenants/                     # Tenant/Society management (SaaS)
│   │   ├── societies/                   # Society profile & structure
│   │   ├── residents/                   # Resident & family management
│   │   ├── vehicles/                    # Vehicle & parking management
│   │   ├── maintenance/                 # Billing & invoices
│   │   ├── payments/                    # Payments & receipts
│   │   ├── expenses/                    # Expense & finance
│   │   ├── complaints/                  # Complaint & helpdesk
│   │   ├── visitors/                    # Visitor management
│   │   ├── security/                    # Security & gates
│   │   ├── deliveries/                  # Delivery management
│   │   ├── amenities/                   # Facilities & amenities
│   │   ├── staff/                       # Staff management
│   │   ├── vendors/                     # Vendor management
│   │   ├── assets/                      # Asset management
│   │   ├── announcements/               # Announcements
│   │   ├── notifications/               # Notification engine
│   │   ├── documents/                   # Documents & records
│   │   ├── meetings/                    # Meetings & governance
│   │   └── dashboard/                   # Reports & super dashboard
│   │
│   └── jobs/                            # BullMQ background jobs
│       ├── invoice-generation.job.ts
│       ├── notification.job.ts
│       ├── payment-reminder.job.ts
│       └── sla-checker.job.ts
│
├── database/                            # Database files (outer)
│   └── migrations/                      # TypeORM migration files (CLI target)
│
├── docs/                                # Project documentation
│   ├── modules-and-features.md
│   ├── phases.md
│   ├── roles-and-permissions.md
│   ├── security-rules.md
│   ├── architecture.md                  # This file
│   └── rules.md
│
├── test/                                # E2E tests
│   └── jest-e2e.json
│
├── .env                                 # Environment variables (gitignored)
├── .env.example                         # Example env file (committed)
├── nest-cli.json                        # NestJS CLI config
├── tsconfig.json
├── tsconfig.build.json
└── package.json
```

---

## Database Architecture

### Schema Overview

```
PostgreSQL Database: sms_production
│
├── tenants                 # SaaS tenant registry
├── users                   # All user accounts
├── user_sessions           # Refresh token store
├── societies               # Society profiles
├── towers                  # Buildings/towers
├── floors                  # Floors per tower
├── units                   # Flats/units
├── unit_types              # 1BHK, 2BHK etc.
├── residents               # Resident profiles
├── family_members          # Family members per resident
├── emergency_contacts      # Emergency contacts
├── vehicles                # Registered vehicles
├── parking_slots           # Parking inventory
├── parking_allocations     # Slot assignments
├── maintenance_rules       # Billing rule configs
├── maintenance_invoices    # Generated invoices
├── invoice_items           # Line items per invoice
├── payments                # Payment transactions
├── receipts                # Generated receipts
├── expenses                # Society expenses
├── bank_accounts           # Society bank accounts
├── complaints              # Complaints raised
├── complaint_comments      # Comment threads
├── visitors                # Visitor records
├── visitor_entries         # Entry/exit log
├── deliveries              # Delivery records
├── amenities               # Amenity definitions
├── amenity_slots           # Time slot config
├── amenity_bookings        # Booking records
├── staff                   # Staff profiles
├── staff_attendance        # Attendance logs
├── vendors                 # Vendor profiles
├── vendor_contracts        # Contracts
├── vendor_invoices         # Vendor invoices
├── assets                  # Asset register
├── asset_maintenance_logs  # Maintenance history
├── announcements           # Published announcements
├── notifications           # Notification records
├── documents               # Document metadata
├── meetings                # Meeting records
├── meeting_resolutions     # Voting/resolutions
├── audit_logs              # Full audit trail
└── gates                   # Gate definitions
```

### Database Migration Strategy (Strictly Enforced)

> ⚠️ **MANDATORY POLICY**:
> - **Zero Schema Drift / Zero Synchronize**: `synchronize` is strictly disabled (`false`) across all non-scratch environments.
> - **Every Database Change via Migration**: Any change to tables, columns, indexes, foreign keys, constraints, or enums **MUST** be made through a TypeORM migration file in `src/database/migrations/`.
> - **Entity ↔ Migration Parity**: Whenever an entity is added or modified, a matching migration with both `up()` and `down()` methods must be created and verified before deployment.
> - Migration CLI commands:
>   - `npm run migration:run` — Applies all pending migrations
>   - `npm run migration:revert` — Reverts the last migration
>   - `npm run migration:show` — Displays migration history and status

### Entity Base Class

All entities extend `BaseEntity`:

```typescript
// src/common/entities/base.entity.ts
import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date; // Soft delete
}
```

---

## Module Architecture Pattern

Every NestJS module follows this consistent pattern:

```
modules/users/
├── users.module.ts          # Module definition + imports
├── users.controller.ts      # Route handlers + Swagger docs
├── users.service.ts         # Business logic
├── entities/
│   └── user.entity.ts       # TypeORM entity
└── dto/
    ├── create-user.dto.ts   # POST body validation
    └── update-user.dto.ts   # PATCH body validation
```

### Generated via NestJS CLI
```bash
# Generate a complete resource (no spec/test files)
nest g resource modules/users --no-spec

# Generates:
# - users.module.ts
# - users.controller.ts
# - users.service.ts
# - dto/create-user.dto.ts
# - dto/update-user.dto.ts
# - entities/user.entity.ts
```

---

## Request Lifecycle

```
HTTP Request
     │
     ▼
[Middleware]          → Helmet, CORS, Body Parser, Rate Limit
     │
     ▼
[Guards]              → JwtAuthGuard → RolesGuard → ScopeGuard
     │
     ▼
[Interceptors - Pre]  → LoggingInterceptor, ScopeInterceptor
     │
     ▼
[Pipes]               → ValidationPipe (DTO validation)
     │
     ▼
[Controller]          → Route handler
     │
     ▼
[Service]             → Business logic
     │
     ▼
[Repository]          → TypeORM (PostgreSQL query)
     │
     ▼
[Interceptors - Post] → TransformInterceptor (response wrapper)
     │
     ▼
HTTP Response
```

---

## API Response Format

All API responses follow a consistent envelope format:

```typescript
// Success Response
{
  "success": true,
  "statusCode": 200,
  "message": "Invoice fetched successfully",
  "data": { ... },
  "meta": {             // For paginated responses
    "total": 240,
    "page": 1,
    "limit": 20,
    "totalPages": 12
  }
}

// Error Response
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Must be a valid email" }
  ],
  "timestamp": "2026-08-27T18:00:00.000Z",
  "path": "/api/v1/users"
}
```

---

## Background Jobs Architecture

```
BullMQ (Redis-backed)
│
├── invoice-queue
│   └── GenerateMonthlyInvoices    # Runs on 1st of each month
│
├── notification-queue
│   ├── SendPushNotification
│   ├── SendSMS
│   ├── SendEmail
│   └── SendWhatsApp
│
├── reminder-queue
│   └── PaymentOverdueReminder     # Daily check for overdue
│
└── sla-queue
    └── SLABreachChecker           # Every 30 minutes
```

---

## Environment Configuration

```
.env.development    → Local development with Docker
.env.staging        → Staging server (identical structure to prod)
.env.production     → Production (secrets via Secrets Manager)
```

### Required Environment Variables

```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=sms_user
DB_PASSWORD=your_strong_password
DB_DATABASE=sms_development
DB_SSL=false
DB_SYNCHRONIZE=false
DB_LOGGING=true

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your_256_bit_secret_minimum_32_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_256_bit_secret
JWT_REFRESH_EXPIRES_IN=7d

# Frontend URLs (CORS)
FRONTEND_URL=http://localhost:3001
GUARD_APP_URL=http://localhost:3002

# File Storage
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
AWS_S3_BUCKET=sms-documents-dev

# Payment Gateway
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# SMS
MSG91_AUTH_KEY=
MSG91_SENDER_ID=

# Email
SENDGRID_API_KEY=
FROM_EMAIL=noreply@societyms.com

# WhatsApp
WHATSAPP_API_TOKEN=
WHATSAPP_PHONE_ID=
```

---

## TypeORM & Migration Workflow

```bash
# Generate a new migration after entity changes
npx typeorm migration:generate database/migrations/MigrationName -d src/config/database.config.ts

# Run pending migrations
npx typeorm migration:run -d src/config/database.config.ts

# Revert last migration
npx typeorm migration:revert -d src/config/database.config.ts

# Show migration status
npx typeorm migration:show -d src/config/database.config.ts
```

---

## API Versioning

All routes are prefixed with `/api/v1/`:

```
/api/v1/auth/login
/api/v1/auth/refresh
/api/v1/users
/api/v1/societies
/api/v1/residents
/api/v1/maintenance/invoices
/api/v1/payments
/api/v1/complaints
/api/v1/visitors
...
```

---

## Swagger API Documentation

Accessible at `/api/docs` in development:

```typescript
// main.ts
const config = new DocumentBuilder()
  .setTitle('Society Management System API')
  .setDescription('Complete REST API for SMS V1')
  .setVersion('1.0')
  .addBearerAuth()
  .addTag('auth', 'Authentication & Sessions')
  .addTag('users', 'User Management')
  .addTag('residents', 'Resident & Family')
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

---

*This document is the canonical reference for the Society Management System architecture.*
