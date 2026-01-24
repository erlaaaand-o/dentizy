// domains/services/security-guard.service.ts
import { Injectable, Logger } from '@nestjs/common';

/**
 * Interface untuk tracking failed attempts
 */
interface FailedAttempt {
  count: number;
  lockedUntil?: number;
  firstAttemptAt?: number;
}

@Injectable()
export class SecurityGuardService {
  private readonly logger = new Logger(SecurityGuardService.name);

  // Security thresholds - constants
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
  private readonly ATTEMPT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

  // In-memory store (production: use Redis)
  // Key: username/email, Value: attempt data
  private readonly failedAttempts = new Map<string, FailedAttempt>();

  /**
   * Check if account is locked due to failed attempts
   */
  isAccountLocked(identifier: string): boolean {
    const attempt = this.failedAttempts.get(identifier);

    if (!attempt) {
      return false;
    }

    // Check if lockout period is active
    if (attempt.lockedUntil && Date.now() < attempt.lockedUntil) {
      this.logger.warn(`Account locked: ${identifier}`);
      return true;
    }

    // Unlock if lockout period has passed
    if (attempt.lockedUntil && Date.now() >= attempt.lockedUntil) {
      this.failedAttempts.delete(identifier);
      this.logger.log(`Account unlocked after timeout: ${identifier}`);
      return false;
    }

    return false;
  }

  /**
   * Record failed login attempt
   */
  recordFailedAttempt(identifier: string): void {
    const currentTime = Date.now();
    const attempt = this.failedAttempts.get(identifier);

    if (!attempt) {
      // First failed attempt
      this.failedAttempts.set(identifier, {
        count: 1,
        firstAttemptAt: currentTime,
      });
      this.logger.debug(`First failed attempt recorded for: ${identifier}`);
      return;
    }

    // Reset counter if attempt window has passed
    if (
      attempt.firstAttemptAt &&
      currentTime - attempt.firstAttemptAt > this.ATTEMPT_WINDOW_MS
    ) {
      this.failedAttempts.set(identifier, {
        count: 1,
        firstAttemptAt: currentTime,
      });
      this.logger.debug(`Failed attempt counter reset for: ${identifier}`);
      return;
    }

    // Increment attempt counter
    attempt.count += 1;

    // Lock account if threshold reached
    if (attempt.count >= this.MAX_FAILED_ATTEMPTS) {
      attempt.lockedUntil = currentTime + this.LOCKOUT_DURATION_MS;
      this.logger.warn(
        `Account locked after ${this.MAX_FAILED_ATTEMPTS} failed attempts: ${identifier}`,
      );
    } else {
      this.logger.debug(
        `Failed attempt ${attempt.count}/${this.MAX_FAILED_ATTEMPTS} for: ${identifier}`,
      );
    }

    this.failedAttempts.set(identifier, attempt);
  }

  /**
   * Clear failed attempts on successful login
   */
  clearFailedAttempts(identifier: string): void {
    const wasLocked = this.failedAttempts.has(identifier);
    this.failedAttempts.delete(identifier);

    if (wasLocked) {
      this.logger.log(`Failed attempts cleared for: ${identifier}`);
    }
  }

  /**
   * Get remaining lockout time in seconds
   */
  getRemainingLockoutTime(identifier: string): number {
    const attempt = this.failedAttempts.get(identifier);

    if (!attempt?.lockedUntil) {
      return 0;
    }

    const remaining = Math.max(0, attempt.lockedUntil - Date.now());
    return Math.ceil(remaining / 1000);
  }

  /**
   * Get current failed attempt count
   */
  getFailedAttemptCount(identifier: string): number {
    return this.failedAttempts.get(identifier)?.count || 0;
  }

  /**
   * Check if identifier is currently being tracked
   */
  isTracking(identifier: string): boolean {
    return this.failedAttempts.has(identifier);
  }

  /**
   * Manual unlock (for admin purposes)
   */
  unlockAccount(identifier: string): boolean {
    const wasLocked = this.failedAttempts.has(identifier);
    this.failedAttempts.delete(identifier);

    if (wasLocked) {
      this.logger.log(`Account manually unlocked: ${identifier}`);
    }

    return wasLocked;
  }

  /**
   * Get all locked accounts (for monitoring)
   */
  getLockedAccounts(): string[] {
    const locked: string[] = [];
    const currentTime = Date.now();

    this.failedAttempts.forEach((attempt, identifier) => {
      if (attempt.lockedUntil && currentTime < attempt.lockedUntil) {
        locked.push(identifier);
      }
    });

    return locked;
  }

  /**
   * Clean up expired entries (should be called periodically)
   */
  cleanupExpiredEntries(): number {
    const currentTime = Date.now();
    let cleanedCount = 0;

    this.failedAttempts.forEach((attempt, identifier) => {
      // Remove if locked period has expired
      if (attempt.lockedUntil && currentTime >= attempt.lockedUntil) {
        this.failedAttempts.delete(identifier);
        cleanedCount++;
      }
      // Remove if attempt window has expired and not locked
      else if (
        !attempt.lockedUntil &&
        attempt.firstAttemptAt &&
        currentTime - attempt.firstAttemptAt > this.ATTEMPT_WINDOW_MS
      ) {
        this.failedAttempts.delete(identifier);
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned up ${cleanedCount} expired entries`);
    }

    return cleanedCount;
  }
}
