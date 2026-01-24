import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

export interface StandardResponse<T = unknown> {
  statusCode: number;
  message: string;
  data?: T;
  meta?: Record<string, unknown>;
  timestamp: string;
}

interface ResponseWithStandardStructure {
  statusCode: number;
  message?: string;
  data?: unknown;
  meta?: Record<string, unknown>;
}

@Injectable()
export class PaymentTransformInterceptor<T> implements NestInterceptor<
  T,
  StandardResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponse<T>> {
    return next.handle().pipe(
      map((response: T | ResponseWithStandardStructure) => {
        // If response already has the standard structure, return as is
        if (
          response &&
          typeof response === 'object' &&
          'statusCode' in response
        ) {
          const typedResponse = response as ResponseWithStandardStructure;
          return {
            statusCode: typedResponse.statusCode,
            message: typedResponse.message || 'Success',
            data: typedResponse.data,
            meta: typedResponse.meta,
            timestamp: new Date().toISOString(),
          } as StandardResponse<T>;
        }

        // Otherwise, wrap it in standard structure
        const ctx = context.switchToHttp();
        const httpResponse = ctx.getResponse<Response>();

        return {
          statusCode: httpResponse.statusCode,
          message: 'Success',
          data: response as T,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
