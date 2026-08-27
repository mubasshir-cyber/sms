import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

/**
 * TypeORM database configuration factory.
 * Uses @nestjs/config ConfigService to read all values from environment variables.
 *
 * - synchronize: ALWAYS false — use migrations instead
 * - logging: only in development
 * - ssl: enabled in production
 */
export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DB_HOST', 'localhost'),
  port: configService.get<number>('DB_PORT', 5432),
  username: configService.get<string>('DB_USERNAME', 'postgres'),
  password: configService.get<string>('DB_PASSWORD'),
  database: configService.get<string>('DB_DATABASE', 'sms_development'),

  // ⚠️ NEVER set synchronize: true in production — use migrations
  synchronize: configService.get<string>('NODE_ENV') === 'development'
    ? configService.get<boolean>('DB_SYNCHRONIZE', false)
    : false,

  // Logging: only in development to avoid leaking sensitive query data
  logging: configService.get<string>('NODE_ENV') === 'development',

  // SSL for production
  ssl: configService.get<string>('NODE_ENV') === 'production'
    ? { rejectUnauthorized: true }
    : false,

  // Entity & migration discovery
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],

  // Auto-run migrations on startup
  migrationsRun: configService.get<string>('NODE_ENV') !== 'development',

  // pgAdmin & logging metadata
  applicationName: 'society-management-system',
});
