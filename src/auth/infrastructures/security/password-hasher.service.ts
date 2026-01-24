// infrastructure/security/password-hasher.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

/**
 * Interface untuk hasil validasi kekuatan password
 */
interface PasswordStrengthResult {
  strong: boolean;
  reasons: string[];
}

@Injectable()
export class PasswordHasherService {
  private readonly logger = new Logger(PasswordHasherService.name);
  private readonly SALT_ROUNDS = 10;
  private readonly DUMMY_HASH =
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

  /**
   * Hash password using bcrypt
   */
  async hash(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, this.SALT_ROUNDS);
    } catch (error) {
      this.logger.error(
        'Failed to hash password',
        error instanceof Error ? error.stack : 'Unknown error',
      );
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Compare plain password with hashed password
   */
  async compare(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      this.logger.error(
        'Failed to compare passwords',
        error instanceof Error ? error.stack : 'Unknown error',
      );
      return false;
    }
  }

  /**
   * Perform dummy comparison to prevent timing attacks
   */
  async dummyCompare(plainPassword: string): Promise<boolean> {
    return this.compare(plainPassword, this.DUMMY_HASH);
  }

  /**
   * Verify password strength (business rule implementation)
   */
  isStrongPassword(password: string): PasswordStrengthResult {
    const reasons: string[] = [];

    if (password.length < 8) {
      reasons.push('Password harus minimal 8 karakter');
    }

    if (!/[a-z]/.test(password)) {
      reasons.push('Password harus mengandung huruf kecil');
    }

    if (!/[A-Z]/.test(password)) {
      reasons.push('Password harus mengandung huruf besar');
    }

    if (!/[0-9]/.test(password)) {
      reasons.push('Password harus mengandung angka');
    }

    if (!/[^a-zA-Z0-9]/.test(password)) {
      reasons.push('Password harus mengandung karakter spesial');
    }

    return {
      strong: reasons.length === 0,
      reasons,
    };
  }
}
