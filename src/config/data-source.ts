import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * TypeORM CLI DataSource — used by TypeORM CLI for migration generation & running.
 * This file is ONLY for CLI operations, not for the NestJS app runtime.
 *
 * Usage:
 *   npx typeorm migration:generate src/database/migrations/MigrationName -d src/config/data-source.ts
 *   npx typeorm migration:run -d src/config/data-source.ts
 *   npx typeorm migration:revert -d src/config/data-source.ts
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE ?? 'sms_development',

  // ⚠️ Never synchronize via CLI DataSource
  synchronize: false,

  logging: true,

  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: true }
    : false,

  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
});
