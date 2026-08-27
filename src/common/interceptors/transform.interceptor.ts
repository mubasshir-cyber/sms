import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface SuccessResponse<T> {
  success: true;
  statusCode: number;
  data: T;
  timestamp: string;
}

/**
 * Global Transform Interceptor.
 *
 * Wraps every successful controller response in a consistent JSON envelope.
 *
 * Output shape:
 * {
 *   "success": true,
 *   "statusCode": 200,
 *   "data": { ... },
 *   "timestamp": "2026-08-27T18:00:00.000Z"
 * }
 *
 * Paginated responses also include "meta":
 * {
 *   "success": true,
 *   "statusCode": 200,
 *   "data": [...],
 *   "meta": { "total": 100, "page": 1, "limit": 20, "totalPages": 5 },
 *   "timestamp": "..."
 * }
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, SuccessResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<SuccessResponse<T>> {
    const statusCode = context.switchToHttp().getResponse().statusCode;

    return next.handle().pipe(
      map((data) => ({
        success: true as const,
        statusCode,
        // If the service returned { data, meta } for pagination, spread it
        ...(data && typeof data === 'object' && 'meta' in data
          ? { data: (data as { data: T; meta: unknown }).data, meta: (data as { data: T; meta: unknown }).meta }
          : { data }),
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
