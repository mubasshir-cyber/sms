import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { RefreshToken } from './entities/refresh-token.entity';
import { UsersModule } from '../users/users.module';

/**
 * AuthModule — handles authentication and token management.
 *
 * Wires:
 * - PassportModule (default strategy: 'jwt')
 * - JwtModule (async config from ConfigService)
 * - TypeORM RefreshToken repository
 * - JwtStrategy + JwtRefreshStrategy (passport strategies)
 * - Imports UsersModule for credential validation
 */
@Module({
  imports: [
    // Passport with JWT as default strategy
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // JWT module — async so we read from ConfigService
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          // Cast needed: @nestjs/jwt strict StringValue type vs plain string
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m') as unknown as number,
        },
      }),
    }),

    // RefreshToken table
    TypeOrmModule.forFeature([RefreshToken]),

    // UsersModule — needed for credential lookup during login
    UsersModule,
  ],
  providers: [
    AuthService,
    JwtStrategy,        // Registers 'jwt' passport strategy
    JwtRefreshStrategy, // Registers 'jwt-refresh' passport strategy
  ],
  controllers: [AuthController],
  exports: [
    JwtModule,     // Export so other modules can sign tokens if needed
    AuthService,
  ],
})
export class AuthModule {}
