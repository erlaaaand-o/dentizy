import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
  HttpException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface UserData {
  id: string | number;
  username: string;
}

interface RequestWithTrace extends Request {
  requestId?: string;
  user?: UserData;
}

interface ErrorWithStatus extends Error {
  status?: number;
  statusCode?: number;
}

@Injectable()
export class LoggingInterceptor<T> implements NestInterceptor<T, T> {
  private readonly logger = new Logger('HTTP');

  // Daftar field sensitif yang harus di-mask
  private readonly sensitiveFields = [
    'password',
    'token',
    'access_token',
    'refresh_token',
    'authorization',
    'cookie',
    'secret',
  ];

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<T> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<RequestWithTrace>();
    const response = ctx.getResponse<Response>();

    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || 'Unknown';
    const startTime = Date.now();

    const requestId = (headers['x-request-id'] as string) || uuidv4();

    request.requestId = requestId;

    response.setHeader('X-Request-ID', requestId);

    // Extract user info dari request (jika sudah login)
    const user = request.user;
    const userId = user?.id || 'Anonymous';
    const username = user?.username || 'Guest';

    this.logger.log(
      `[${requestId}] [${method}] ${url} | User: ${username} (ID: ${userId}) | IP: ${ip}`,
    );

    // Log request body (dengan masking)
    if (request.body && Object.keys(request.body as object).length > 0) {
      const sanitizedBody = this.maskSensitiveData(request.body);
      this.logger.debug(
        `[${requestId}] Request Body: ${JSON.stringify(sanitizedBody, null, 2)}`,
      );
    }

    return next.handle().pipe(
      tap((data: T) => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        this.logger.log(
          `[${requestId}] [${method}] ${url} | Status: ${statusCode} | ${duration}ms | User: ${username}`,
        );

        // Log response data (hanya di development mode)
        if (process.env.NODE_ENV === 'development' && data) {
          const sanitizedData = this.maskSensitiveData(data);
          const responsePreview = JSON.stringify(
            sanitizedData,
            null,
            2,
          ).substring(0, 500);
          this.logger.debug(
            `[${requestId}] Response Data: ${responsePreview}${responsePreview.length >= 500 ? '...' : ''}`,
          );
        }

        if (duration > 1000) {
          this.logger.warn(
            `[${requestId}] ⚠️ Slow Response: [${method}] ${url} took ${duration}ms`,
          );
        }

        this.trackPerformanceMetrics(method, url, duration, statusCode);
      }),
      catchError((error: unknown) => {
        const duration = Date.now() - startTime;

        // Handle Unknown Error Type
        let statusCode = 500;
        let errorMessage = 'Unknown error';
        let errorStack: string | undefined;

        if (error instanceof HttpException) {
          statusCode = error.getStatus();
          errorMessage = error.message;
          errorStack = error.stack;
        } else if (error instanceof Error) {
          const errWithStatus = error as ErrorWithStatus;
          statusCode = errWithStatus.status || errWithStatus.statusCode || 500;
          errorMessage = error.message;
          errorStack = error.stack;
        }

        this.logger.error(
          `[${requestId}] [${method}] ${url} | Status: ${statusCode} | ${duration}ms | User: ${username} | Error: ${errorMessage}`,
        );

        if (process.env.NODE_ENV === 'development') {
          this.logger.error(`[${requestId}] Stack Trace: ${errorStack}`);
        }

        this.logger.error(
          `[${requestId}] Error Context: { userId: ${userId}, ip: ${ip}, userAgent: ${userAgent} }`,
        );

        return throwError(() => error);
      }),
    );
  }

  /**
   * Mask sensitive data dari object
   */
  private maskSensitiveData(data: unknown): unknown {
    if (!data || typeof data !== 'object') {
      return data;
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map((item) => this.maskSensitiveData(item));
    }

    // Handle objects
    const masked = { ...(data as Record<string, unknown>) };

    for (const key in masked) {
      if (Object.prototype.hasOwnProperty.call(masked, key)) {
        const lowerKey = key.toLowerCase();

        if (this.sensitiveFields.some((field) => lowerKey.includes(field))) {
          masked[key] = '***MASKED***';
        } else if (typeof masked[key] === 'object' && masked[key] !== null) {
          masked[key] = this.maskSensitiveData(masked[key]);
        }
      }
    }

    return masked;
  }

  private trackPerformanceMetrics(
    method: string,
    url: string,
    duration: number,
    statusCode: number,
  ): void {
    if (duration > 3000) {
      this.logger.error(
        `🔴 CRITICAL SLOW ENDPOINT: [${method}] ${url} took ${duration}ms (status: ${statusCode})`,
      );
    } else if (duration > 1000) {
      this.logger.warn(
        `🟡 SLOW ENDPOINT: [${method}] ${url} took ${duration}ms (status: ${statusCode})`,
      );
    }
  }
}
