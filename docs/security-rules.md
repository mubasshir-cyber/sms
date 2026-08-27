# 🛡️ Security Rules & Checkup Guidelines — Society Management System

> **Version:** V1  
> **Last Updated:** August 2026  
> **Framework:** NestJS + TypeORM + PostgreSQL  
> **Compliance Target:** OWASP Top 10, Data Privacy (PDPA/DPDP Act India)

---

## Overview

This document defines the mandatory security rules, implementation checklists, and ongoing security review procedures for the SMS backend. Every developer must review and adhere to these rules before pushing code to production.

---

## 1. Authentication Security

### 1.1 JWT Configuration
- [ ] JWT secret must be a minimum **256-bit random string** stored in `.env` — never hardcoded
- [ ] Access token expiry: **15 minutes** maximum
- [ ] Refresh token expiry: **7 days** maximum
- [ ] Refresh tokens must be stored in the database (allow revocation)
- [ ] Use `RS256` (asymmetric) for production; `HS256` only for development
- [ ] JWT must include: `sub`, `role`, `societyId`, `iat`, `exp`
- [ ] Rotate JWT secret every **90 days** in production

```typescript
// ✅ Correct JWT config
JwtModule.register({
  secret: process.env.JWT_SECRET,
  signOptions: {
    expiresIn: '15m',
    algorithm: 'HS256',
  },
})

// ❌ NEVER do this
JwtModule.register({ secret: 'my-secret-123' })
```

### 1.2 Password Policy
- [ ] Minimum **8 characters**, must include uppercase, lowercase, number, and special character
- [ ] Passwords must be hashed with **bcrypt** (`saltRounds: 12` minimum)
- [ ] Never store or log plain-text passwords
- [ ] Password reset tokens expire in **15 minutes**
- [ ] Password reset tokens are single-use (invalidate after first use)
- [ ] Implement account lockout after **5 consecutive failed login attempts** (15-minute lockout)

```typescript
// ✅ Correct password hashing
const hashedPassword = await bcrypt.hash(password, 12);

// ❌ Never use saltRounds less than 10
const hashedPassword = await bcrypt.hash(password, 5);
```

### 1.3 OTP Security
- [ ] OTP must be **6 digits**, numeric only
- [ ] OTP expires in **5 minutes**
- [ ] OTP is single-use (mark as used immediately on verification)
- [ ] Rate-limit OTP generation: max **3 OTPs per phone per 10 minutes**
- [ ] OTPs stored as **hashed values** in database — never plain text

### 1.4 Session Management
- [ ] Implement token blacklist for logout (Redis preferred)
- [ ] Force logout all sessions on password change
- [ ] Log all login events (IP, device, timestamp) to audit table
- [ ] Detect and alert on suspicious login (new device/location)

---

## 2. Authorization Security

### 2.1 Guards — Mandatory Stack
Every protected route **must** have all three guards applied:

```typescript
// ✅ Correct — all three guards
@Get(':id')
@UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
@Roles(Role.SOCIETY_ADMIN, Role.ACCOUNTANT)
findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {}

// ❌ Missing scope guard — data leak risk
@Get(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
findOne(@Param('id') id: string) {}
```

### 2.2 Data Scope Enforcement
- [ ] **Every** database query must include `society_id` filter — no exceptions
- [ ] Implement `ScopeInterceptor` as a global interceptor
- [ ] Never trust user-supplied `societyId` from request body — always use `user.societyId` from JWT
- [ ] Unit-scoped resources must validate `unitId` belongs to the requesting user
- [ ] Guard-scoped resources must validate gate assignment

```typescript
// ✅ Correct — use JWT-derived societyId
async findInvoice(id: string, user: AuthUser) {
  return this.repo.findOne({
    where: { id, societyId: user.societyId }, // Always scoped!
  });
}

// ❌ Never trust request param for scope
async findInvoice(id: string, societyId: string) {
  return this.repo.findOne({ where: { id, societyId } }); // Attacker can inject any societyId
}
```

### 2.3 Privilege Escalation Prevention
- [ ] Role assignment endpoint must verify the assigner has permission to grant that specific role
- [ ] `SOCIETY_ADMIN` cannot assign `SUPER_ADMIN` role
- [ ] Users cannot modify their own role
- [ ] Validate role hierarchy on every role assignment mutation

---

## 3. Input Validation & Sanitization

### 3.1 DTO Validation (class-validator)
- [ ] **All** incoming request bodies must be validated with class-validator DTOs
- [ ] Enable global `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true`
- [ ] Never use `any` type on DTO properties
- [ ] Validate all path parameters and query parameters

```typescript
// ✅ Global ValidationPipe setup in main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,           // Strip unknown properties
  forbidNonWhitelisted: true, // Throw error on unknown properties
  transform: true,           // Auto-transform types
  transformOptions: {
    enableImplicitConversion: true,
  },
}));
```

```typescript
// ✅ Example DTO
export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%])/, {
    message: 'Password too weak',
  })
  password: string;

  @IsEnum(Role)
  role: Role;
}
```

### 3.2 SQL Injection Prevention
- [ ] **Never** use raw SQL strings with user input — always use TypeORM parameterized queries
- [ ] If raw queries are required, use TypeORM's `query()` with parameters array

```typescript
// ✅ Safe — parameterized
this.repo.find({ where: { email: userInput } });

// ✅ Safe — raw with parameters
this.dataSource.query('SELECT * FROM users WHERE email = $1', [userInput]);

// ❌ SQL Injection risk
this.dataSource.query(`SELECT * FROM users WHERE email = '${userInput}'`);
```

### 3.3 XSS Prevention
- [ ] Sanitize all rich-text fields (announcements, complaint descriptions) using `sanitize-html`
- [ ] Never render user-supplied HTML directly
- [ ] Set `Content-Security-Policy` headers
- [ ] Use `helmet` middleware for all security headers

```typescript
// ✅ Install and use helmet in main.ts
import helmet from 'helmet';
app.use(helmet());
```

---

## 4. API Security

### 4.1 Rate Limiting
- [ ] Apply global rate limit: **100 requests per minute per IP**
- [ ] Auth endpoints (login, OTP): **10 requests per minute per IP**
- [ ] Payment endpoints: **20 requests per minute per user**
- [ ] Use `@nestjs/throttler` for implementation

```typescript
// ✅ ThrottlerModule setup
ThrottlerModule.forRoot([{
  name: 'global',
  ttl: 60000,  // 1 minute
  limit: 100,
}])

// Stricter limit for auth routes
@Throttle({ auth: { ttl: 60000, limit: 10 } })
@Post('login')
login(@Body() dto: LoginDto) {}
```

### 4.2 CORS Configuration
- [ ] Never set `origin: '*'` in production
- [ ] Whitelist only known frontend domains
- [ ] Set `credentials: true` only when required

```typescript
// ✅ Production CORS
app.enableCors({
  origin: [process.env.FRONTEND_URL, process.env.GUARD_APP_URL],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
});

// ❌ Never in production
app.enableCors({ origin: '*' });
```

### 4.3 HTTP Headers
All responses must include these headers (enforced by `helmet`):

| Header | Value |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `1; mode=block` |
| `Strict-Transport-Security` | `max-age=31536000` |
| `Content-Security-Policy` | Configured per environment |
| `Referrer-Policy` | `no-referrer` |

### 4.4 Request Size Limits
- [ ] Set maximum request body size: **10MB** (for file uploads)
- [ ] Set maximum JSON body size: **1MB**
- [ ] Validate file type and size before processing

```typescript
// ✅ In main.ts
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
```

---

## 5. Data Security & Privacy

### 5.1 Sensitive Data Handling
- [ ] **Never** log passwords, OTPs, or payment card numbers
- [ ] Mask Aadhaar numbers in responses (show last 4 digits only): `XXXX-XXXX-1234`
- [ ] Mask phone numbers in visitor/delivery logs for non-admin roles
- [ ] Encrypt sensitive fields at rest (Aadhaar, PAN) using AES-256

```typescript
// ✅ Masking example
maskAadhaar(aadhaar: string): string {
  return `XXXX-XXXX-${aadhaar.slice(-4)}`;
}
```

### 5.2 Data Retention & Deletion
- [ ] Visitor records: retain for **90 days**, then auto-archive
- [ ] Delivery records: retain for **30 days**
- [ ] Audit logs: retain for **1 year** minimum
- [ ] Financial records: retain for **7 years** (statutory requirement)
- [ ] Implement "Right to Delete" for resident PII on request

### 5.3 File Upload Security
- [ ] Validate file MIME type server-side (not just extension)
- [ ] Scan uploaded files for malware (ClamAV or AWS GuardDuty)
- [ ] Store files in private S3/cloud buckets — never publicly accessible
- [ ] Generate signed URLs for file access with **15-minute expiry**
- [ ] Never serve user-uploaded files from the same domain as the API

```typescript
// ✅ File type validation
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
  throw new BadRequestException('Invalid file type');
}

if (file.size > 5 * 1024 * 1024) { // 5MB
  throw new BadRequestException('File too large');
}
```

---

## 6. Database Security

### 6.1 Connection Security
- [ ] Use SSL for all database connections in production
- [ ] Database credentials must be in `.env` — never hardcoded
- [ ] Use a dedicated DB user per environment (dev / staging / prod)
- [ ] DB user must have minimum required privileges (not `postgres` superuser)
- [ ] Enable pgAudit extension for query logging in production

```env
# ✅ .env (never commit to git)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=sms_app_user
DB_PASSWORD=<strong-random-password>
DB_DATABASE=sms_production
DB_SSL=true
```

### 6.2 TypeORM Security
- [ ] Always use migrations — never `synchronize: true` in production
- [ ] Use database transactions for multi-step operations
- [ ] Implement soft deletes (`DeleteDateColumn`) — no hard deletes on critical data
- [ ] Add `created_at`, `updated_at`, `deleted_at` to every entity

```typescript
// ✅ Production TypeORM config
TypeOrmModule.forRoot({
  type: 'postgres',
  synchronize: false,   // NEVER true in production
  logging: false,       // NEVER true in production (logs sensitive data)
  ssl: { rejectUnauthorized: true },
  migrations: ['dist/database/migrations/*.js'],
  migrationsRun: true,
})

// ❌ Never in production
TypeOrmModule.forRoot({
  synchronize: true,  // Can drop and recreate tables!
  logging: true,      // Logs all queries with data
})
```

### 6.3 Migrations
- [ ] Every schema change must have a migration file
- [ ] Migration files are version-controlled and never modified after running
- [ ] Test migrations on staging before applying to production
- [ ] Always include a `down()` method for rollback
- [ ] Never run migrations directly in production without backup

---

## 7. Environment & Secrets Management

### 7.1 Environment Variables
- [ ] All secrets in `.env` files — committed to `.gitignore`
- [ ] Use `.env.example` with placeholder values for documentation
- [ ] Use environment-specific files: `.env.development`, `.env.staging`, `.env.production`
- [ ] Validate all required env vars at startup using `@nestjs/config` + `Joi`

```typescript
// ✅ Config validation with Joi
ConfigModule.forRoot({
  validationSchema: Joi.object({
    NODE_ENV: Joi.string().valid('development', 'staging', 'production').required(),
    DB_HOST: Joi.string().required(),
    DB_PASSWORD: Joi.string().min(16).required(),
    JWT_SECRET: Joi.string().min(32).required(),
    PORT: Joi.number().default(3000),
  }),
})
```

### 7.2 Secrets Checklist
| Secret | Storage | Rotation |
|---|---|---|
| JWT Secret | `.env` / Secrets Manager | Every 90 days |
| DB Password | `.env` / Secrets Manager | Every 90 days |
| Payment Gateway API Key | `.env` / Secrets Manager | On compromise |
| SMS Gateway API Key | `.env` / Secrets Manager | Annually |
| WhatsApp API Token | `.env` / Secrets Manager | Annually |
| S3 / Storage Keys | IAM Role (preferred) | N/A with IAM |

---

## 8. Security Audit Checklist

Run this checklist before every production release:

### Pre-Deployment Checklist
- [ ] All DTOs have validation decorators
- [ ] All routes have `JwtAuthGuard` + `RolesGuard` + `ScopeGuard`
- [ ] No `console.log` with sensitive data in production code
- [ ] `synchronize: false` in TypeORM config
- [ ] Helmet middleware enabled
- [ ] Rate limiting configured
- [ ] CORS configured with specific origins
- [ ] All secrets are in `.env` (not hardcoded)
- [ ] `.env` is in `.gitignore`
- [ ] All migrations tested on staging
- [ ] Dependency audit run: `npm audit`
- [ ] No critical or high vulnerabilities in dependencies
- [ ] File upload validation implemented
- [ ] Sensitive fields masked in API responses

### Monthly Security Review
- [ ] Review audit logs for suspicious activity
- [ ] Check for failed login attempt spikes
- [ ] Review user role assignments for anomalies
- [ ] Run `npm audit` and patch vulnerabilities
- [ ] Review access logs for unusual patterns
- [ ] Verify backup integrity

### Quarterly Security Review
- [ ] Rotate JWT secrets
- [ ] Rotate database passwords
- [ ] Review and update CORS whitelist
- [ ] Full dependency update review
- [ ] Penetration test (or third-party security scan)
- [ ] Review data retention compliance

---

## 9. Incident Response

### Severity Levels
| Level | Description | Response Time |
|---|---|---|
| 🔴 P1 — Critical | Data breach, unauthorized access, production down | 30 minutes |
| 🟠 P2 — High | Authentication bypass, data exposure | 2 hours |
| 🟡 P3 — Medium | Privilege escalation attempt, rate limit bypass | 24 hours |
| 🟢 P4 — Low | Minor security misconfiguration | 72 hours |

### Response Steps (P1/P2)
1. **Isolate** — Take affected service offline or block the attack vector
2. **Assess** — Determine scope of data affected
3. **Notify** — Alert development lead and security officer
4. **Remediate** — Apply fix and rotate compromised secrets
5. **Restore** — Bring service back online
6. **Post-Mortem** — Document root cause and preventive measures

---

*This document must be reviewed and signed off by the tech lead before every major release.*
