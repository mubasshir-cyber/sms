import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errors?: Record<string, unknown>[] | string[];
  timestamp: string;
  path: string;
}

/**
 * Global HTTP Exception Filter.
 *
 * Catches every thrown exception (HttpException or unknown error) and
 * returns a consistent JSON error envelope across the entire API.
 *
 * Error shape:
 * {
 *   "success": false,
 *   "statusCode": 400,
 *   "message": "Validation failed",
 *   "errors": [{ "field": "email", "message": "Must be a valid email" }],
 *   "timestamp": "2026-08-27T18:00:00.000Z",
 *   "path": "/api/v1/users"
 * }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: Record<string, unknown>[] | string[] | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const res = exceptionResponse as Record<string, unknown>;
        message = (res.message as string) ?? exception.message;

        // class-validator returns an array of messages on 400
        if (Array.isArray(res.message)) {
          message = 'Validation failed';
          errors = res.message as string[];
        }

        if (res.errors) {
          errors = res.errors as Record<string, unknown>[];
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      // Log unexpected errors with full stack
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception.stack,
      );
    }

    const errorResponse: ErrorResponse = {
      success: false,
      statusCode,
      message,
      ...(errors ? { errors } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(statusCode).json(errorResponse);
  }
}
