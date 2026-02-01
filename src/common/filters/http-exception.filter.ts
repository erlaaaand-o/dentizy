import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  BadRequestException,
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

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithUser>();

    const timestamp = new Date().toISOString();
    const path = request.originalUrl;
    const method = request.method;

    const user = request.user;
    const userId = user?.id ?? 'Anonymous';
    const username = user?.username ?? 'Guest';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Terjadi kesalahan pada server';
    let errorName = 'InternalServerError';
    let errorDetails: string | object | null = null;

    // ========================================
    // 1. HTTP Exceptions (NestJS)
    // ========================================
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      errorName = exception.name;

      const exceptionResponse = exception.getResponse();

      // 404 - Route tidak ditemukan
      if (exception instanceof NotFoundException) {
        message = 'Endpoint tidak ditemukan';
        errorName = 'ENDPOINT_NOT_FOUND';
        errorDetails = {
          method,
          path,
        };
      }
      // 400 - Validation error
      else if (exception instanceof BadRequestException) {
        const res = exceptionResponse as HttpExceptionResponse;
        message = res.message ?? 'Request tidak valid';
      }
      // General HttpException
      else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const res = exceptionResponse as HttpExceptionResponse;
        message = res.message ?? exception.message;
        errorDetails = res.error ?? null;
      } else {
        message = exception.message;
      }
    }

    // ========================================
    // 2. Database Errors (TypeORM)
    // ========================================
    else if (exception instanceof QueryFailedError) {
      status = HttpStatus.BAD_REQUEST;
      errorName = 'DatabaseError';

      const dbError = exception as QueryFailedError & DatabaseError;

      if (dbError.code === 'ER_DUP_ENTRY') {
        message = 'Data sudah ada (duplikat)';
        errorDetails = this.extractDuplicateField(dbError.message);
      } else if (dbError.code === 'ER_NO_REFERENCED_ROW_2') {
        message = 'Referensi data tidak valid';
        errorDetails = 'Foreign key constraint failed';
      } else {
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
    // 3. Unknown Errors
    // ========================================
    else {
      if (exception instanceof Error) {
        this.logger.error(
          `Unhandled Error: ${exception.message} | User: ${username} | Path: ${path}`,
          exception.stack,
        );

        if (process.env.NODE_ENV === 'development') {
          errorDetails = exception.message;
        }
      } else {
        this.logger.error(
          `Unknown Error: ${String(exception)} | User: ${username} | Path: ${path}`,
        );
      }
    }

    // ========================================
    // 4. Response
    // ========================================
    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp,
      path,
      method,
      code: errorName,
      message,
      ...(errorDetails && { details: errorDetails }),
      ...(process.env.NODE_ENV === 'development' && {
        user: { id: userId, username },
      }),
    };

    // ========================================
    // 5. Audit Log
    // ========================================
    this.logger.error(
      `❌ [${method}] ${path} | ${status} | ${errorName} | User: ${username} (${userId})`,
    );

    response.status(status).json(errorResponse);
  }

  private extractDuplicateField(errorMessage: string): string {
    const match = errorMessage.match(/for key '([^']+)'/);
    return match
      ? `Field '${match[1]}' sudah digunakan`
      : 'Duplicate entry detected';
  }
}
