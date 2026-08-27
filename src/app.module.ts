import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import * as Joi from 'joi';

import { getDatabaseConfig } from './config/database.config';

// ─── Global Guards (applied to every route) ──────────────────────────────────
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

// ─── Feature Modules ─────────────────────────────────────────────────────────
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './modules/health/health.module';
// Phase 1 — coming next:
// import { TenantsModule } from './modules/tenants/tenants.module';
// import { SocietiesModule } from './modules/societies/societies.module';
// import { ResidentsModule } from './modules/residents/residents.module';
// import { MaintenanceModule } from './modules/maintenance/maintenance.module';
// import { PaymentsModule } from './modules/payments/payments.module';
// import { ExpensesModule } from './modules/expenses/expenses.module';
// import { NotificationsModule } from './modules/notifications/notifications.module';
// import { DashboardModule } from './modules/dashboard/dashboard.module';
// Phase 2:
// import { ComplaintsModule } from './modules/complaints/complaints.module';
// import { VisitorsModule } from './modules/visitors/visitors.module';
// import { SecurityModule } from './modules/security/security.module';
// import { DeliveriesModule } from './modules/deliveries/deliveries.module';
// import { StaffModule } from './modules/staff/staff.module';
// import { AnnouncementsModule } from './modules/announcements/announcements.module';
// import { VehiclesModule } from './modules/vehicles/vehicles.module';
// Phase 3:
// import { AmenitiesModule } from './modules/amenities/amenities.module';
// import { VendorsModule } from './modules/vendors/vendors.module';
// import { AssetsModule } from './modules/assets/assets.module';
// import { DocumentsModule } from './modules/documents/documents.module';
// import { MeetingsModule } from './modules/meetings/meetings.module';

@Module({
  imports: [
    // ─── Configuration ──────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV ?? 'development'}`,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'staging', 'production')
          .default('development'),
        PORT: Joi.number().default(3000),
        API_PREFIX: Joi.string().default('api/v1'),
        // Database
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(5432),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        DB_SSL: Joi.boolean().default(false),
        DB_SYNCHRONIZE: Joi.boolean().default(false),
        // JWT — min 32 chars enforced here
        JWT_SECRET: Joi.string().min(32).required(),
        JWT_EXPIRES_IN: Joi.string().default('15m'),
        JWT_REFRESH_SECRET: Joi.string().min(32).required(),
        JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
        // CORS
        FRONTEND_URL: Joi.string().uri().default('http://localhost:3001'),
        GUARD_APP_URL: Joi.string().uri().default('http://localhost:3002'),
        // Rate Limiting
        THROTTLE_TTL_MS: Joi.number().default(60000),
        THROTTLE_LIMIT: Joi.number().default(100),
      }),
    }),

    // ─── Database ────────────────────────────────────────────────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),

    // ─── Rate Limiting ───────────────────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ([{
        name: 'global',
        ttl: configService.get<number>('THROTTLE_TTL_MS', 60000),
        limit: configService.get<number>('THROTTLE_LIMIT', 100),
      }]),
    }),

    // ─── Feature Modules ─────────────────────────────────────────────────────
    HealthModule,   // GET /health — public liveness probe
    AuthModule,     // POST /auth/* — login, register, refresh, logout
    UsersModule,    // GET|POST|PATCH|DELETE /users
  ],

  providers: [
    // ─── Global Guards ───────────────────────────────────────────────────────
    // These apply to EVERY route automatically.
    // Use @Public() to opt out of JWT check.
    // Use @Roles(...) to restrict by role.
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,     // 1st: rate limiting
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,       // 2nd: JWT authentication (@Public() bypasses)
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,         // 3rd: RBAC role check (@Roles() required)
    },
  ],
})
export class AppModule {}
