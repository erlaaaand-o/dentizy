// domains/services/credential-validation.service.ts
import { Injectable, Logger } from '@nestjs/common';

/**
 * Interface untuk hasil validasi
 */
interface ValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Interface untuk hasil validasi lengkap credentials
 */
interface CredentialValidationResult {
  valid: boolean;
  errors: string[];
}

@Injectable()
export class CredentialValidationService {
  private readonly logger = new Logger(CredentialValidationService.name);

  // Business rules - constants
  private readonly MIN_USERNAME_LENGTH = 3;
  private readonly MAX_USERNAME_LENGTH = 50;
  private readonly MIN_PASSWORD_LENGTH = 8;
  private readonly USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

  /**
   * Validate username format
   */
  validateUsername(username: string): ValidationResult {
    if (!username) {
      return { valid: false, message: 'Username tidak boleh kosong' };
    }

    // Trim ONCE and reuse
    const trimmedUsername = username.trim();

    if (trimmedUsername.length === 0) {
      return { valid: false, message: 'Username tidak boleh kosong' };
    }

    if (trimmedUsername.length < this.MIN_USERNAME_LENGTH) {
      return {
        valid: false,
        message: `Username minimal ${this.MIN_USERNAME_LENGTH} karakter`,
      };
    }

    if (trimmedUsername.length > this.MAX_USERNAME_LENGTH) {
      return {
        valid: false,
        message: `Username maksimal ${this.MAX_USERNAME_LENGTH} karakter`,
      };
    }

    if (!this.USERNAME_REGEX.test(trimmedUsername)) {
      return {
        valid: false,
        message: 'Username hanya boleh mengandung huruf, angka, dan underscore',
      };
    }

    return { valid: true };
  }

  /**
   * Validate password format (not strength, just basic format)
   */
  validatePasswordFormat(password: string): ValidationResult {
    if (!password || password.length === 0) {
      return { valid: false, message: 'Password tidak boleh kosong' };
    }

    if (password.length < this.MIN_PASSWORD_LENGTH) {
      return {
        valid: false,
        message: `Password minimal ${this.MIN_PASSWORD_LENGTH} karakter`,
      };
    }

    return { valid: true };
  }

  /**
   * Validate credentials completely
   */
  validateCredentials(
    username: string,
    password: string,
  ): CredentialValidationResult {
    const errors: string[] = [];

    const usernameResult = this.validateUsername(username);
    if (!usernameResult.valid && usernameResult.message) {
      errors.push(usernameResult.message);
    }

    const passwordResult = this.validatePasswordFormat(password);
    if (!passwordResult.valid && passwordResult.message) {
      errors.push(passwordResult.message);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
