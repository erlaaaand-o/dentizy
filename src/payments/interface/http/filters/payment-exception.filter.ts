import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

interface HttpExceptionResponse {
  message: string | string[];
  error?: string;
  statusCode?: number;
  errors?: Record<string, unknown>;
}

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string;
  errors?: Record<string, unknown>;
}

@Catch()
export class PaymentExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PaymentExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: Record<string, unknown> | null = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const typedResponse = exceptionResponse as HttpExceptionResponse;
        message = Array.isArray(typedResponse.message)
          ? typedResponse.message.join(', ')
          : typedResponse.message || message;
        errors = typedResponse.errors || null;
      } else {
        message = exceptionResponse as string;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(
      `Payment Exception: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    };

    if (errors) {
      errorResponse.errors = errors;
    }

    response.status(status).json(errorResponse);
  }
}
