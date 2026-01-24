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

interface HttpExceptionResponse {
  message: string | string[];
  error?: string;
  details?: unknown;
}

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  error: string;
  message: string | string[];
  details?: unknown;
  validationErrors?: ValidationError[];
  stack?: string;
}

interface ValidationError {
  message: string;
}

interface DatabaseError {
  message: string;
  error: string;
  details?: DatabaseErrorDetails;
}

interface DatabaseErrorDetails {
  constraint?: string;
  table?: string;
  column?: string;
  code?: string;
  detail?: string;
}

interface PostgresError extends Error {
  code?: string;
  constraint?: string;
  table?: string;
  column?: string;
  detail?: string;
}

@Catch()
export class UserExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(UserExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'InternalServerError';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else {
        const responseObj = exceptionResponse as HttpExceptionResponse;
        message = responseObj.message || message;
        error = responseObj.error || error;
        details = responseObj.details;
      }
    } else if (exception instanceof QueryFailedError) {
      status = HttpStatus.BAD_REQUEST;
      const dbError = this.handleDatabaseError(exception);
      message = dbError.message;
      error = dbError.error;
      details = dbError.details;
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    this.logger.error(
      `${request.method} ${request.url} - Status: ${status} - Error: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error,
      message,
    };

    if (details) {
      errorResponse.details = details;
    }

    if (status === HttpStatus.BAD_REQUEST && Array.isArray(message)) {
      errorResponse.validationErrors = message.map((msg) => ({ message: msg }));
      errorResponse.message = 'Validation failed';
    }

    if (process.env.NODE_ENV === 'development' && exception instanceof Error) {
      errorResponse.stack = exception.stack;
    }

    response.status(status).json(errorResponse);
  }

  private handleDatabaseError(error: QueryFailedError): DatabaseError {
    const dbError = error as unknown as PostgresError;

    switch (dbError.code) {
      case '23505':
        return {
          message: this.extractUniqueViolationMessage(dbError),
          error: 'ConflictError',
          details: {
            constraint: dbError.constraint,
            table: dbError.table,
          },
        };

      case '23503':
        return {
          message: 'Data terkait tidak ditemukan atau sedang digunakan',
          error: 'ForeignKeyViolation',
          details: {
            constraint: dbError.constraint,
            table: dbError.table,
          },
        };

      case '23502':
        return {
          message: 'Field yang required tidak boleh kosong',
          error: 'NotNullViolation',
          details: {
            column: dbError.column,
            table: dbError.table,
          },
        };

      case '22P02':
        return {
          message: 'Format data tidak valid',
          error: 'InvalidDataFormat',
        };

      default:
        this.logger.error(`Unhandled database error: ${dbError.code}`, dbError);
        return {
          message: 'Database error occurred',
          error: 'DatabaseError',
          details:
            process.env.NODE_ENV === 'development'
              ? { code: dbError.code, detail: dbError.detail }
              : undefined,
        };
    }
  }

  private extractUniqueViolationMessage(error: PostgresError): string {
    if (error.constraint?.includes('username')) {
      return 'Username sudah digunakan';
    }

    if (error.constraint?.includes('email')) {
      return 'Email sudah terdaftar';
    }

    if (error.detail) {
      const match = error.detail.match(/Key \((.+?)\)=\((.+?)\)/);
      if (match) {
        return `${match[1]} "${match[2]}" sudah digunakan`;
      }
    }

    return 'Data sudah ada dalam sistem';
  }
}
