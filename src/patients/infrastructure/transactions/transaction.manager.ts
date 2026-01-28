import {
  Injectable,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';

@Injectable()
export class TransactionManager {
  private readonly logger = new Logger(TransactionManager.name);
  private readonly MAX_RETRY_ATTEMPTS = 5;

  constructor(private readonly dataSource: DataSource) {}

  async executeWithRetry<T>(
    operation: (queryRunner: QueryRunner) => Promise<T>,
  ): Promise<T> {
    let lastError: Error = new Error('Unknown error occurred');

    for (let attempt = 1; attempt <= this.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        return await this.executeTransaction(operation);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        await this.handleError(error, attempt);
      }
    }

    this.logger.error(
      `❌ Failed after ${this.MAX_RETRY_ATTEMPTS} attempts:`,
      lastError,
    );
    throw new BadRequestException('Operasi gagal setelah beberapa percobaan');
  }

  private async executeTransaction<T>(
    operation: (queryRunner: QueryRunner) => Promise<T>,
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await operation(queryRunner);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async handleError(error: unknown, attempt: number): Promise<void> {
    if (
      error instanceof ConflictException ||
      error instanceof BadRequestException
    ) {
      throw error;
    }

    if (!this.isRetryableError(error)) {
      this.logger.error('❌ Transaction error:', error);
      throw new BadRequestException('Operasi gagal dilakukan');
    }

    if (attempt < this.MAX_RETRY_ATTEMPTS) {
      const backoffTime = Math.min(100 * Math.pow(2, attempt - 1), 1000);
      this.logger.warn(
        `⚠️ Retry attempt ${attempt}/${this.MAX_RETRY_ATTEMPTS} after ${backoffTime}ms`,
      );
      await new Promise((resolve) => setTimeout(resolve, backoffTime));
    }
  }

  private isRetryableError(error: unknown): boolean {
    if (
      typeof error !== 'object' ||
      error === null ||
      !('code' in error) ||
      !('message' in error)
    ) {
      return false;
    }

    const dbError = error as { code?: string | number; message?: string };

    const retryableCodes = [
      'ER_LOCK_DEADLOCK',
      'ER_LOCK_WAIT_TIMEOUT',
      1213,
      1205,
    ];

    const errorCode = dbError.code;
    const errorMessage = dbError.message?.toLowerCase() || '';

    return retryableCodes.some(
      (code) =>
        errorCode === code ||
        errorMessage.includes(
          typeof code === 'string' ? code.toLowerCase() : '',
        ),
    );
  }
}
