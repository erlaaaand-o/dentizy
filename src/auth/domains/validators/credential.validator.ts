// domains/validators/credential.validator.ts
import { BadRequestException } from '@nestjs/common';

export class CredentialValidator {
  /**
   * Validate and sanitize username
   */
  static validateUsername(username: string): string {
    if (!username) {
      throw new BadRequestException('Username is required');
    }

    const trimmed = username.trim().toLowerCase();

    if (trimmed.length < 3) {
      throw new BadRequestException('Username must be at least 3 characters');
    }

    if (trimmed.length > 50) {
      throw new BadRequestException('Username must not exceed 50 characters');
    }

    const usernameRegex = /^[a-z0-9_]+$/;
    if (!usernameRegex.test(trimmed)) {
      throw new BadRequestException(
        'Username can only contain lowercase letters, numbers, and underscores',
      );
    }

    return trimmed;
  }

  /**
   * Validate password
   */
  static validatePassword(password: string): void {
    if (!password) {
      throw new BadRequestException('Password is required');
    }

    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    // Additional strength checks can be added here
  }
}
