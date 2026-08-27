# 📐 Development Rules & Coding Conventions — Society Management System

> **Version:** V1  
> **Last Updated:** August 2026  
> **Stack:** NestJS · TypeScript · TypeORM · PostgreSQL  

---

## 1. Project Conventions

### 1.1 Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Files | `kebab-case` | `user.service.ts`, `create-user.dto.ts` |
| Classes | `PascalCase` | `UserService`, `CreateUserDto` |
| Variables / Functions | `camelCase` | `findAllUsers()`, `userId` |
| Constants | `SCREAMING_SNAKE_CASE` | `JWT_EXPIRES_IN`, `MAX_FILE_SIZE` |
| Enums | `PascalCase` (name) + `SCREAMING_SNAKE_CASE` (values) | `Role.SOCIETY_ADMIN` |
| Database Tables | `snake_case`, plural | `maintenance_invoices`, `parking_slots` |
| Database Columns | `snake_case` | `created_at`, `society_id` |
| TypeORM Entities | `PascalCase`, singular | `User`, `MaintenanceInvoice` |
| API Routes | `kebab-case`, plural, noun-first | `/maintenance-invoices`, `/parking-slots` |
| Environment Variables | `SCREAMING_SNAKE_CASE` | `DB_HOST`, `JWT_SECRET` |

---

### 1.2 File Structure Rules

```
# Every module MUST follow this exact structure:
modules/<module-name>/
├── <module-name>.module.ts
├── <module-name>.controller.ts
├── <module-name>.service.ts
├── entities/
│   └── <entity-name>.entity.ts
└── dto/
    ├── create-<module-name>.dto.ts
    └── update-<module-name>.dto.ts
```

- Generate using: `nest g resource modules/<name> --no-spec`
- Never put business logic in controllers
- Never put database queries in controllers
- Never put HTTP logic (request/response) in services

---

## 2. TypeScript Rules

### 2.1 Type Safety
- [ ] **Never use `any`** — use `unknown` or proper types instead
- [ ] All function parameters and return types must be explicitly typed
- [ ] Use `interface` for objects that describe shape, `type` for unions/intersections
- [ ] Use `readonly` for properties that should never be mutated
- [ ] Enable strict mode in `tsconfig.json` — it must stay enabled

```typescript
// ✅ Correct
async findUser(id: string): Promise<User> {
  return this.usersRepo.findOneOrFail({ where: { id } });
}

// ❌ Never use any
async findUser(id: any): Promise<any> {}
```

### 2.2 Async / Await
- Always use `async/await` — never use `.then().catch()` chains
- Always handle errors with `try/catch` or NestJS exception filters
- Never use `Promise.resolve()` when you can `return` directly

```typescript
// ✅ Correct
async createUser(dto: CreateUserDto): Promise<User> {
  const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
  if (existing) throw new ConflictException('Email already registered');
  return this.usersRepo.save(dto);
}

// ❌ Promise chains
createUser(dto: CreateUserDto) {
  return this.usersRepo.findOne({ where: { email: dto.email } })
    .then(existing => { ... })
    .catch(err => { ... });
}
```

### 2.3 Error Handling
- Use NestJS built-in exceptions — never throw raw `Error` objects
- Use appropriate HTTP exception classes

```typescript
// ✅ Correct NestJS exceptions
throw new NotFoundException(`User ${id} not found`);
throw new ConflictException('Email already registered');
throw new ForbiddenException('You do not have access to this resource');
throw new BadRequestException('Invalid invoice status');
throw new UnauthorizedException('Invalid credentials');
throw new InternalServerErrorException('Failed to process payment');
```

---

## 3. NestJS Module Rules

### 3.1 Module Organization
- Each feature must have its own module
- Modules must be self-contained (no circular dependencies)
- Use `forwardRef()` sparingly — prefer refactoring to eliminate circular deps
- Shared functionality goes in `CommonModule` or dedicated shared modules

### 3.2 Controller Rules
```typescript
// ✅ Every controller must:
@ApiTags('users')                          // Swagger tag
@ApiBearerAuth()                           // Marks as auth-required in Swagger
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)       // Guards on controller level
export class UsersController {

  @Get()
  @Roles(Role.SOCIETY_ADMIN)               // Specific roles per method
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200, type: [User] })
  findAll(@CurrentUser() user: AuthUser) {
    return this.usersService.findAll(user);
  }
}
```

### 3.3 Service Rules
- Services must be stateless (no instance-level mutable state)
- Services interact with repositories only — never directly with HTTP
- Business logic belongs in services, not in controllers or entities
- Never inject `Request` into services

```typescript
// ✅ Correct service structure
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async findAll(user: AuthUser): Promise<User[]> {
    return this.usersRepo.find({
      where: { societyId: user.societyId }, // Always scoped!
    });
  }
}
```

---

## 4. TypeORM & Database Rules

### 4.1 Entity Rules
- Every entity MUST extend `BaseEntity` (provides `id`, `createdAt`, `updatedAt`, `deletedAt`)
- Use `@Column({ name: 'snake_case_name' })` for explicit column naming
- Use `nullable: false` by default — be explicit when `nullable: true`
- Use `@Index()` on columns used in `WHERE` clauses frequently
- Use `@Unique()` on columns with unique constraints
- Use UUIDs (`uuid` strategy) as primary keys — never auto-increment integers

```typescript
// ✅ Correct entity
@Entity('users')
export class User extends BaseEntity {
  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ unique: true, length: 255 })
  @Index()
  email: string;

  @Column({ name: 'password_hash', select: false }) // Never return in queries
  passwordHash: string;

  @Column({ type: 'enum', enum: Role, default: Role.RESIDENT })
  role: Role;

  @Column({ name: 'society_id', type: 'uuid', nullable: true })
  @Index()
  societyId: string;

  @ManyToOne(() => Society, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'society_id' })
  society: Society;
}
```

### 4.2 Query Rules
- **Always scope queries** by `societyId` from the authenticated user
- Use `findOne` over `find` when expecting a single result
- Use `findOneOrFail` when the entity must exist (auto-throws `EntityNotFoundError`)
- Use `.select()` to limit returned columns — never return `passwordHash`
- Use relations selectively — don't always `join` everything

```typescript
// ✅ Scoped, select specific fields
async findInvoice(id: string, user: AuthUser): Promise<MaintenanceInvoice> {
  const invoice = await this.invoicesRepo.findOne({
    where: { id, societyId: user.societyId },
    relations: ['unit', 'resident'],
    select: ['id', 'amount', 'dueDate', 'status', 'createdAt'],
  });
  if (!invoice) throw new NotFoundException('Invoice not found');
  return invoice;
}

// ❌ No scope, returns all fields including sensitive ones
async findInvoice(id: string): Promise<MaintenanceInvoice> {
  return this.invoicesRepo.findOne({ where: { id } });
}
```

### 4.3 Migration Rules
- **Never use `synchronize: true` in any environment except local development**
- Every schema change **must** have a corresponding migration file
- Migration file names format: `{timestamp}-{PascalCaseDescription}.ts`
- Always implement both `up()` and `down()` methods
- Test `down()` migration (rollback) before merging

```typescript
// ✅ Migration file template
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUsers1724000000001 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: 'users',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
        { name: 'email', type: 'varchar', length: '255', isUnique: true },
        { name: 'role', type: 'enum', enum: ['super_admin', 'society_admin', ...] },
        { name: 'society_id', type: 'uuid', isNullable: true },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
        { name: 'updated_at', type: 'timestamp', default: 'now()' },
        { name: 'deleted_at', type: 'timestamp', isNullable: true },
      ],
    }));
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
```

---

## 5. DTO Rules

### 5.1 Validation Rules
- All DTO properties must have at least one validation decorator
- Use `@IsOptional()` explicitly on optional fields (not just `?`)
- Use `@Type(() => Number)` when expecting number from query params
- `UpdateDto` must use `PartialType(CreateDto)` — do not duplicate validators

```typescript
// ✅ Create DTO
export class CreateResidentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @IsEmail()
  email: string;

  @IsPhoneNumber('IN')
  phone: string;

  @IsUUID()
  unitId: string;

  @IsEnum(ResidentType)
  type: ResidentType; // OWNER | TENANT
}

// ✅ Update DTO — reuse Create
export class UpdateResidentDto extends PartialType(CreateResidentDto) {}
```

### 5.2 Response DTOs
- Create separate response DTOs for sensitive entities to control what gets returned
- Never return `passwordHash` or sensitive columns in responses

```typescript
// ✅ Response DTO strips sensitive fields
export class UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  createdAt: Date;
  // ❌ passwordHash is NOT here
}
```

---

## 6. API Design Rules

### 6.1 RESTful Conventions

| Action | Method | Route | Example |
|---|---|---|---|
| List all | `GET` | `/<resource>` | `GET /residents` |
| Get one | `GET` | `/<resource>/:id` | `GET /residents/:id` |
| Create | `POST` | `/<resource>` | `POST /residents` |
| Full update | `PUT` | `/<resource>/:id` | `PUT /residents/:id` |
| Partial update | `PATCH` | `/<resource>/:id` | `PATCH /residents/:id` |
| Delete | `DELETE` | `/<resource>/:id` | `DELETE /residents/:id` |
| Sub-resource | `GET` | `/<resource>/:id/<sub>` | `GET /residents/:id/vehicles` |

### 6.2 HTTP Status Codes

| Status | Usage |
|---|---|
| `200 OK` | Successful GET, PATCH, PUT |
| `201 Created` | Successful POST |
| `204 No Content` | Successful DELETE |
| `400 Bad Request` | Validation error |
| `401 Unauthorized` | Missing or invalid token |
| `403 Forbidden` | Valid token but insufficient permissions |
| `404 Not Found` | Resource not found |
| `409 Conflict` | Duplicate resource (email, phone) |
| `422 Unprocessable Entity` | Business rule violation |
| `429 Too Many Requests` | Rate limit exceeded |
| `500 Internal Server Error` | Unexpected server error |

### 6.3 Pagination
- All list endpoints must support pagination
- Default page size: `20`, maximum: `100`

```typescript
// ✅ Pagination DTO
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
```

---

## 7. Git & Version Control Rules

### 7.1 Branch Naming
```
feature/<module>/<short-description>    → feature/residents/add-emergency-contacts
bugfix/<module>/<short-description>     → bugfix/payments/fix-duplicate-receipt
hotfix/<short-description>             → hotfix/fix-jwt-expiry
migration/<description>                → migration/add-parking-slots-table
refactor/<description>                 → refactor/extract-scope-interceptor
```

### 7.2 Commit Message Format (Conventional Commits)
```
<type>(<scope>): <short description>

Types:
  feat     → New feature
  fix      → Bug fix
  docs     → Documentation changes
  style    → Formatting, no logic change
  refactor → Code restructure, no feature change
  test     → Adding or fixing tests
  chore    → Build process, deps update
  migration → Database migration files

Examples:
  feat(residents): add family member management
  fix(payments): prevent duplicate receipt generation
  docs(api): update Swagger annotations for billing
  migration(parking): add parking_slots table
  chore(deps): update typeorm to 0.3.21
```

### 7.3 Pull Request Rules
- No direct commits to `main` or `develop` branches
- PRs must have at least 1 reviewer approval before merge
- All CI checks must pass (lint, build, tests)
- PR description must reference the issue/task it resolves

---

## 8. Logging Rules

- Use NestJS `Logger` service — never `console.log` in production
- Log format: `[ModuleName] Action description`
- Never log passwords, tokens, or sensitive PII
- Log levels: `error` > `warn` > `log` > `debug` > `verbose`

```typescript
// ✅ Correct logging
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  async processPayment(dto: ProcessPaymentDto): Promise<Receipt> {
    this.logger.log(`Processing payment for invoice: ${dto.invoiceId}`);
    // ...
    this.logger.log(`Payment successful: receipt ${receipt.id}`);
    return receipt;
  }
}

// ❌ Never
console.log(`Payment data: ${JSON.stringify(dto)}`); // Could log card numbers!
```

---

## 9. Testing Rules

- Unit tests for all service methods
- Integration tests for all controller endpoints
- Test files co-located: `*.spec.ts` (generated tests should be written, not skipped)
- Test coverage minimum: **80%** for services
- Use `--no-spec` flag only in initial generation, then write the spec manually
- Mock external dependencies (payment gateway, SMS) in tests

```bash
# Run tests
npm run test

# Run with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e
```

---

## 10. Performance Rules

- Use `@Index()` on all foreign key columns and frequent filter columns
- Avoid N+1 queries — use TypeORM `relations` or `QueryBuilder` with JOINs
- Paginate all list endpoints — no unbounded queries
- Cache frequently read, rarely changed data in Redis (society settings, role configs)
- Use `select` to fetch only needed columns — especially on large tables
- Use database-level constraints (NOT NULL, UNIQUE, FK) — don't rely on application-only validation

---

*All team members must read, understand, and follow these rules. Questions should be raised in the team channel.*
