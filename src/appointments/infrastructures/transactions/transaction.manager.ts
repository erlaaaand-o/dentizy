import { Injectable, Logger } from '@nestjs/common';
import { QueryRunner } from 'typeorm';

/**
 * Type untuk operation yang akan dieksekusi dalam transaction
 */
type TransactionOperation<T> = (qr: QueryRunner) => Promise<T>;

/**
 * Interface untuk error MySQL/MariaDB
 */
interface MySQLError extends Error {
  code?: string;
  errno?: number;
  sqlState?: string;
  sqlMessage?: string;
}

/**
 * Transaction manager untuk handle database transactions
 * Reusable transaction wrapper dengan proper error handling
 */
@Injectable()
export class TransactionManager {
  private readonly logger = new Logger(TransactionManager.name);

  // Database error codes
  private readonly DEADLOCK_ERROR_CODES = [
    'ER_LOCK_DEADLOCK',
    '40001', // SQLSTATE for deadlock
  ];

  /**
   * Execute operation dalam transaction
   * Auto rollback jika error, auto release connection
   */
  async executeInTransaction<T>(
    queryRunner: QueryRunner,
    operation: TransactionOperation<T>,
    operationName: string = 'transaction',
  ): Promise<T> {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.debug(`🔄 Starting transaction: ${operationName}`);

      const result = await operation(queryRunner);

      await queryRunner.commitTransaction();
      this.logger.debug(`✅ Transaction committed: ${operationName}`);

      return result;
    } catch (error) {
      await this.handleTransactionError(queryRunner, operationName, error);
      throw error;
    } finally {
      await this.releaseConnection(queryRunner, operationName);
    }
  }

  /**
   * Execute multiple operations dalam single transaction
   */
  async executeMultiple<T>(
    queryRunner: QueryRunner,
    operations: Array<TransactionOperation<T>>,
    operationName: string = 'multiple-operations',
  ): Promise<T[]> {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.debug(`🔄 Starting multiple operations: ${operationName}`);

      const results: T[] = [];
      for (let i = 0; i < operations.length; i++) {
        const operation = operations[i];
        this.logger.debug(
          `  ↳ Executing operation ${i + 1}/${operations.length}`,
        );
        const result = await operation(queryRunner);
        results.push(result);
      }

      await queryRunner.commitTransaction();
      this.logger.debug(`✅ All operations committed: ${operationName}`);

      return results;
    } catch (error) {
      await this.handleTransactionError(queryRunner, operationName, error);
      throw error;
    } finally {
      await this.releaseConnection(queryRunner, operationName);
    }
  }

  /**
   * Execute dengan retry mechanism (untuk deadlock handling)
   */
  async executeWithRetry<T>(
    queryRunner: QueryRunner,
    operation: TransactionOperation<T>,
    maxRetries: number = 3,
    operationName: string = 'transaction-with-retry',
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.debug(
          `🔄 Attempt ${attempt}/${maxRetries}: ${operationName}`,
        );

        return await this.executeInTransaction(
          queryRunner,
          operation,
          operationName,
        );
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if error is deadlock related
        const isDeadlock = this.isDeadlockError(error);

        if (isDeadlock && attempt < maxRetries) {
          const backoffDelay = Math.pow(2, attempt) * 100;
          this.logger.warn(
            `⚠️ Deadlock detected, retrying in ${backoffDelay}ms... (${attempt}/${maxRetries})`,
          );

          await this.sleep(backoffDelay);
          continue;
        }

        // If not deadlock or max retries reached, throw error
        throw error;
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError || new Error('Transaction failed after all retries');
  }

  /**
   * Handle transaction error dengan proper rollback
   */
  private async handleTransactionError(
    queryRunner: QueryRunner,
    operationName: string,
    error: unknown,
  ): Promise<void> {
    try {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `❌ Transaction rolled back: ${operationName}`,
        error instanceof Error ? error.stack : String(error),
      );
    } catch (rollbackError) {
      this.logger.error(
        `⚠️ CRITICAL: Rollback failed for transaction: ${operationName}`,
        rollbackError instanceof Error
          ? rollbackError.stack
          : String(rollbackError),
      );
    }
  }

  /**
   * Release connection dengan proper error handling
   */
  private async releaseConnection(
    queryRunner: QueryRunner,
    operationName: string,
  ): Promise<void> {
    try {
      await queryRunner.release();
      this.logger.debug(`🔌 Connection released: ${operationName}`);
    } catch (releaseError) {
      this.logger.error(
        `⚠️ Failed to release connection: ${operationName}`,
        releaseError instanceof Error
          ? releaseError.stack
          : String(releaseError),
      );
    }
  }

  /**
   * Check if error is deadlock-related
   */
  private isDeadlockError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const mysqlError = error as MySQLError;

    // Check error code
    if (
      mysqlError.code &&
      this.DEADLOCK_ERROR_CODES.includes(mysqlError.code)
    ) {
      return true;
    }

    // Check SQL state
    if (
      mysqlError.sqlState &&
      this.DEADLOCK_ERROR_CODES.includes(mysqlError.sqlState)
    ) {
      return true;
    }

    // Check error message
    const errorMessage = mysqlError.message?.toLowerCase() || '';
    return errorMessage.includes('deadlock');
  }

  /**
   * Sleep utility untuk retry backoff
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if query runner is in transaction
   */
  isInTransaction(queryRunner: QueryRunner): boolean {
    return queryRunner.isTransactionActive;
  }

  /**
   * Get connection status info (untuk debugging)
   */
  getConnectionInfo(queryRunner: QueryRunner): {
    isConnected: boolean;
    isTransactionActive: boolean;
    isReleased: boolean;
  } {
    return {
      isConnected: queryRunner.connection.isInitialized,
      isTransactionActive: queryRunner.isTransactionActive,
      isReleased: queryRunner.isReleased,
    };
  }
}
