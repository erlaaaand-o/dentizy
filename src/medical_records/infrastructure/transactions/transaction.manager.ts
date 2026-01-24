// infrastructure/transactions/transaction.manager.ts
import { Injectable, Logger } from '@nestjs/common';
import { DataSource, QueryRunner, EntityManager } from 'typeorm';

interface DeadlockError extends Error {
  code?: string;
  errno?: number;
}

/**
 * Transaction Manager
 * Provides reusable transaction handling with proper error management
 */
@Injectable()
export class TransactionManager {
  private readonly logger = new Logger(TransactionManager.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Execute operation within a transaction
   * Automatically handles commit/rollback
   */
  async runInTransaction<T>(
    operation: (manager: EntityManager) => Promise<T>,
    context?: string,
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const txId = this.generateTransactionId();
    this.logger.log(
      `Transaction ${txId} started${context ? ` - ${context}` : ''}`,
    );

    try {
      const result = await operation(queryRunner.manager);
      await queryRunner.commitTransaction();

      this.logger.log(`Transaction ${txId} committed successfully`);
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Transaction ${txId} rolled back: ${errorMessage}`,
        errorStack,
      );

      throw error;
    } finally {
      await queryRunner.release();
      this.logger.debug(`Transaction ${txId} connection released`);
    }
  }

  /**
   * Create a query runner for manual transaction control
   */
  async createQueryRunner(): Promise<QueryRunner> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    return queryRunner;
  }

  /**
   * Execute multiple operations in a single transaction
   */
  async runBatch<T>(
    operations: Array<(manager: EntityManager) => Promise<T>>,
    context?: string,
  ): Promise<T[]> {
    return await this.runInTransaction(async (manager) => {
      const results: T[] = [];

      for (let i = 0; i < operations.length; i++) {
        this.logger.debug(
          `Executing batch operation ${i + 1}/${operations.length}`,
        );
        const result = await operations[i](manager);
        results.push(result);
      }

      return results;
    }, context);
  }

  /**
   * Execute operation with savepoint (nested transaction)
   */
  async runWithSavepoint<T>(
    queryRunner: QueryRunner,
    operation: (manager: EntityManager) => Promise<T>,
    savepointName: string = 'sp_' + Date.now(),
  ): Promise<T> {
    this.logger.debug(`Creating savepoint: ${savepointName}`);
    await queryRunner.query(`SAVEPOINT ${savepointName}`);

    try {
      const result = await operation(queryRunner.manager);
      this.logger.debug(`Savepoint ${savepointName} completed`);
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(
        `Rolling back to savepoint ${savepointName}: ${errorMessage}`,
      );
      await queryRunner.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
      throw error;
    }
  }

  /**
   * Check if transaction is active
   */
  isTransactionActive(queryRunner: QueryRunner): boolean {
    return queryRunner.isTransactionActive;
  }

  /**
   * Get current transaction depth
   */
  getTransactionDepth(queryRunner: QueryRunner): number {
    // TypeORM doesn't expose this directly, but we can track manually
    return queryRunner.isTransactionActive ? 1 : 0;
  }

  /**
   * Execute with retry logic for deadlock scenarios
   */
  async runWithRetry<T>(
    operation: (manager: EntityManager) => Promise<T>,
    maxRetries: number = 3,
    context?: string,
  ): Promise<T> {
    let lastError: Error = new Error('Unknown error during transaction retry');

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.debug(
          `Attempt ${attempt}/${maxRetries}${context ? ` - ${context}` : ''}`,
        );

        return await this.runInTransaction(operation, context);
      } catch (error) {
        lastError = error as Error;

        // Check if error is deadlock-related
        if (this.isDeadlockError(error) && attempt < maxRetries) {
          const delay = this.calculateRetryDelay(attempt);
          this.logger.warn(
            `Deadlock detected, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`,
          );
          await this.sleep(delay);
          continue;
        }

        // If not deadlock or max retries reached, throw
        throw error;
      }
    }

    throw lastError;
  }

  /**
   * Execute operations in parallel with individual transactions
   */
  async runParallel<T>(
    operations: Array<(manager: EntityManager) => Promise<T>>,
    context?: string,
  ): Promise<T[]> {
    this.logger.log(
      `Starting ${operations.length} parallel transactions${context ? ` - ${context}` : ''}`,
    );

    const promises = operations.map((op, index) =>
      this.runInTransaction(op, `${context || 'parallel'}_${index}`),
    );

    return await Promise.all(promises);
  }

  /**
   * Generate unique transaction ID for logging
   */
  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if error is a deadlock error
   */
  private isDeadlockError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    const deadlockError = error as DeadlockError;
    const deadlockMessages = [
      'deadlock detected',
      'lock wait timeout',
      'er_lock_deadlock',
      'deadlock found',
    ];

    const errorMessage = deadlockError.message?.toLowerCase() || '';
    return deadlockMessages.some((msg) => errorMessage.includes(msg));
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateRetryDelay(attempt: number): number {
    const baseDelay = 100; // 100ms
    const maxDelay = 2000; // 2 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 100;
    return delay + jitter;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get active connection count (for monitoring)
   */
  getActiveConnectionCount(): number {
    // Use DataSource.isInitialized to determine if the connection is active
    return this.dataSource.isInitialized ? 1 : 0;
  }

  /**
   * Check database connection health
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Database health check failed: ${errorMessage}`);
      return false;
    }
  }
}
