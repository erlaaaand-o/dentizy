// backend/src/payments/interface/http/interceptors/payment-logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class PaymentLoggingInterceptor<T> implements NestInterceptor<T, T> {
  private readonly logger = new Logger(PaymentLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<T> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, body } = request;
    const now = Date.now();

    this.logger.log(`Incoming Request: ${method} ${url}`);

    // Don't log sensitive payment data
    if (body && !url.includes('/payments/')) {
      this.logger.debug(`Request Body: ${JSON.stringify(body)}`);
    }

    return next.handle().pipe(
      tap({
        next: (_data: T) => {
          const responseTime = Date.now() - now;
          this.logger.log(`Completed: ${method} ${url} - ${responseTime}ms`);
        },
        error: (error: unknown) => {
          const responseTime = Date.now() - now;

          const message =
            error instanceof Error ? error.message : 'Unknown Error';

          this.logger.error(
            `Failed: ${method} ${url} - ${responseTime}ms`,
            message,
          );
        },
      }),
    );
  }
}
