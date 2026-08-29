import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');
  const env = configService.get<string>('NODE_ENV', 'development');
  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');

  // ─── Security Headers ───────────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: env === 'production' ? undefined : false,
    }),
  );

  // ─── Global API Prefix ──────────────────────────────────────────────────
  app.setGlobalPrefix(apiPrefix, {
    exclude: [],
  });

  // ─── Global Validation Pipe ─────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: false,
    }),
  );

  // ─── Global Exception Filter ────────────────────────────────────────────
  const reflector = app.get(Reflector);
  app.useGlobalFilters(new HttpExceptionFilter());

  // ─── Global Interceptors ────────────────────────────────────────────────
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // ─── CORS ───────────────────────────────────────────────────────────────
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
  const guardAppUrl = configService.get<string>('GUARD_APP_URL', 'http://localhost:3002');
  app.enableCors({
    origin: env === 'development' ? true : [frontendUrl, guardAppUrl],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Forwarded-For'],
    credentials: true,
  });

  // ─── Swagger (API Documentation) ────────────────────────────────────────
  if (env !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('🏛️ Society Management System — API')
      .setDescription(
        `REST API for the Society Management System V1.\n\n` +
        `**Base URL:** \`/${apiPrefix}\`\n\n` +
        `**Authentication:** Use Bearer JWT token. Login via \`POST /auth/login\` to get a token.\n\n` +
        `**Roles:** \`super_admin\` > \`society_admin\` > \`committee_member\` | \`accountant\` | \`facility_manager\` > \`resident\` | \`tenant\` | \`security_guard\` | \`vendor\``,
      )
      .setVersion('1.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your access token from POST /auth/login',
        },
        'access-token',
      )
      .addTag('health', 'Liveness & readiness probes')
      .addTag('auth', 'Authentication — login, register, refresh, logout')
      .addTag('users', 'User account management')
      .addTag('tenants', 'Platform-level tenant management (SUPER_ADMIN only)')
      .addTag('societies', 'Housing society profiles & settings')
      .addTag('structure', 'Society structure — Towers, Floors, and Units')
      .addTag('residents', 'Resident & family management')
      .addTag('maintenance', 'Maintenance heads, billing rules, late fees & invoices')
      .addTag('payments', 'Payment processing & receipt generation')
      .addTag('expenses', 'Expense tracking & financial ledger')
      .addTag('notifications', 'System & in-app notifications')
      .addTag('dashboard', 'Society 360° KPIs, alerts, and recent activity')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });

    logger.log(`📖 Swagger docs: http://localhost:${port}/${apiPrefix}/docs`);
  }

  // ─── Start Server ───────────────────────────────────────────────────────
  await app.listen(port);

  logger.log(`🚀 SMS API: http://localhost:${port}/${apiPrefix}`);
  logger.log(`🏥 Health:  http://localhost:${port}/${apiPrefix}/health`);
  logger.log(`🌍 Environment: ${env}`);
  logger.log(`🛡️  Global guards: ThrottlerGuard → JwtAuthGuard → RolesGuard`);

  void reflector;
}

bootstrap();
