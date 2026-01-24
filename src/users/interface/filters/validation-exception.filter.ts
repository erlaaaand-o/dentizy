import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ValidationErrorObject {
  property: string;
  constraints?: Record<string, string>;
  value?: unknown;
}

interface FormattedValidationError {
  field?: string;
  message: string;
  value?: unknown;
}

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  error: string;
  message: string;
  validationErrors?: FormattedValidationError[];
}

interface ExceptionResponseBody {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionFilter.name);

  catch(exception: BadRequestException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let validationErrors: FormattedValidationError[] = [];
    let message = 'Validation failed';

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseBody = exceptionResponse as ExceptionResponseBody;

      if (Array.isArray(responseBody.message)) {
        validationErrors = this.formatValidationErrors(responseBody.message);
        message = 'Input validation failed';
      } else if (typeof responseBody.message === 'string') {
        message = responseBody.message;
      }
    }

    this.logger.warn(
      `Validation failed for ${request.method} ${request.url}`,
      validationErrors,
    );

    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error: 'ValidationError',
      message,
      ...(validationErrors.length > 0 && { validationErrors }),
    };

    response.status(status).json(errorResponse);
  }

  private formatValidationErrors(
    errors: (string | ValidationErrorObject)[],
  ): FormattedValidationError[] {
    return errors.map((error): FormattedValidationError => {
      if (typeof error === 'string') {
        return { message: error };
      }

      const constraints = error.constraints || {};
      const constraintMessages = Object.values(constraints);

      return {
        field: error.property,
        message: constraintMessages.join(', '),
        value: error.value,
      };
    });
  }
}
