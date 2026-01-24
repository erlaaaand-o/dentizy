// domains/services/password-policy.service.ts
import { Injectable, Logger, BadRequestException } from '@nestjs/common';

@Injectable()
export class PasswordPolicyService {
  private readonly logger = new Logger(PasswordPolicyService.name);
  private readonly MIN_LENGTH = 8;
  private readonly MAX_LENGTH = 128;

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < this.MIN_LENGTH) {
      errors.push(`Password minimal ${this.MIN_LENGTH} karakter`);
    }

    if (password.length > this.MAX_LENGTH) {
      errors.push(`Password maksimal ${this.MAX_LENGTH} karakter`);
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password harus mengandung huruf kecil');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password harus mengandung huruf besar');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password harus mengandung angka');
    }

    if (!/[^a-zA-Z0-9]/.test(password)) {
      errors.push('Password harus mengandung karakter spesial');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if password is commonly used
   */
  isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password',
      'password123',
      '12345678',
      'qwerty',
      'abc123',
      'password1',
      '123456789',
      'admin123',
    ];

    return commonPasswords.includes(password.toLowerCase());
  }

  /**
   * Validate new password against old password
   */
  validatePasswordChange(oldPassword: string, newPassword: string): void {
    if (oldPassword === newPassword) {
      throw new BadRequestException(
        'Password baru tidak boleh sama dengan password lama',
      );
    }

    if (this.isCommonPassword(newPassword)) {
      throw new BadRequestException(
        'Password terlalu umum, silakan gunakan password yang lebih aman',
      );
    }

    const strengthCheck = this.validatePasswordStrength(newPassword);
    if (!strengthCheck.valid) {
      throw new BadRequestException(
        `Password tidak memenuhi kriteria keamanan: ${strengthCheck.errors.join(', ')}`,
      );
    }
  }

  /**
   * Generate temporary password
   */
  generateTemporaryPassword(): string {
    const length = 12;
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';

    // Ensure at least one of each required character type
    password += this.getRandomChar('abcdefghijklmnopqrstuvwxyz');
    password += this.getRandomChar('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    password += this.getRandomChar('0123456789');
    password += this.getRandomChar('!@#$%^&*');

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    // Shuffle the password
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  private getRandomChar(charset: string): string {
    return charset.charAt(Math.floor(Math.random() * charset.length));
  }
}
