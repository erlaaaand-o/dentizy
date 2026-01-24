import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

interface UserData {
  id: number | string;
  username: string;
}

interface RequestWithUser extends Request {
  user?: UserData;
}

interface HttpExceptionResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}

interface DatabaseError extends Error {
  code?: string;
  errno?: number;
  sqlMessage?: string;
}

/**
 * Global Exception Filter untuk menangani semua error
 * dengan format response yang konsisten dan logging yang baik
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithUser>();

    const timestamp = new Date().toISOString();
    const path = request.url;
    const method = request.method;

    // Extract user info (if authenticated)
    const user = request.user;
    const userId = user?.id || 'Anonymous';
    const username = user?.username || 'Guest';

    let status: number;
    let message: string | string[];
    let errorName: string;
    let errorDetails: string | object | null = null;

    // ========================================
    // 1. Handle HTTP Exceptions (NestJS)
    // ========================================
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      errorName = exception.name;

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as HttpExceptionResponse;
        message = responseObj.message;
        errorDetails = responseObj.error || null;
      } else {
        message = exception.message;
      }
    }
    // ========================================
    // 2. Handle Database Errors (TypeORM)
    // ========================================
    else if (exception instanceof QueryFailedError) {
      status = HttpStatus.BAD_REQUEST;
      errorName = 'DatabaseError';

      const dbError = exception as QueryFailedError & DatabaseError;

      // Handle duplicate entry error
      if (dbError.code === 'ER_DUP_ENTRY') {
        message = 'Data sudah ada (duplikat)';
        errorDetails = this.extractDuplicateField(dbError.message);
      }
      // Handle foreign key constraint error
      else if (dbError.code === 'ER_NO_REFERENCED_ROW_2') {
        message = 'Referensi data tidak valid';
        errorDetails = 'Foreign key constraint failed';
      }
      // Handle other database errors
      else {
        message = 'Kesalahan database';
        errorDetails =
          process.env.NODE_ENV === 'development'
            ? dbError.message
            : 'Database operation failed';
      }

      this.logger.error(
        `Database Error: ${dbError.message} | User: ${username} | Path: ${path}`,
      );
    }
    // ========================================
    // 3. Handle Unknown/Unexpected Errors
    // ========================================
    else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorName = 'InternalServerError';
      message = 'Terjadi kesalahan pada server';

      // Log detail error untuk debugging
      if (exception instanceof Error) {
        this.logger.error(
          `Unhandled Error: ${exception.message} | User: ${username} | Path: ${path}`,
        );

        if (process.env.NODE_ENV === 'development') {
          this.logger.error(`Stack Trace: ${exception.stack}`);
          errorDetails = exception.message;
        }
      } else {
        const stringifiedError = String(exception);
        this.logger.error(
          `Unknown Error: ${stringifiedError} | User: ${username} | Path: ${path}`,
        );
      }
    }

    // ========================================
    // 4. Build Error Response
    // ========================================
    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp,
      path,
      method,
      message,
      error: errorName,
      ...(errorDetails && { details: errorDetails }),
      ...(process.env.NODE_ENV === 'development' && {
        user: { id: userId, username },
      }),
    };

    // ========================================
    // 5. Log Error untuk Audit Trail
    // ========================================
    this.logger.error(
      `❌ [${method}] ${path} | Status: ${status} | User: ${username} (${userId}) | Error: ${errorName}`,
    );

    // ========================================
    // 6. Send Response
    // ========================================
    response.status(status).json(errorResponse);
  }

  /**
   * Extract duplicate field name dari MySQL error message
   * Contoh: "Duplicate entry 'username123' for key 'username'"
   */
  private extractDuplicateField(errorMessage: string): string {
    const match = errorMessage.match(/for key '([^']+)'/);
    return match
      ? `Field '${match[1]}' sudah digunakan`
      : 'Duplicate entry detected';
  }
}
