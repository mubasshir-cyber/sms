import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * Global Logging Interceptor.
 *
 * Logs every incoming request and outgoing response with:
 * - Method, URL, status code, duration
 * - User ID (from JWT if authenticated)
 *
 * Format: [LoggingInterceptor] GET /api/v1/users → 200 (45ms) [user: abc-123]
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const { method, url } = req;
    const userId = (req.user as { sub?: string } | undefined)?.sub ?? 'anonymous';
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse<Response>();
          const duration = Date.now() - start;
          this.logger.log(
            `${method} ${url} → ${res.statusCode} (${duration}ms) [user: ${userId}]`,
          );
        },
        error: (err: Error) => {
          const duration = Date.now() - start;
          this.logger.warn(
            `${method} ${url} → ERROR (${duration}ms) [user: ${userId}]: ${err.message}`,
          );
        },
      }),
    );
  }
}
