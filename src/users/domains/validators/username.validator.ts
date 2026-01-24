// domains/validators/username.validator.ts
import { BadRequestException } from '@nestjs/common';

/**
 * UsernameValidator - Domain validation for username
 * Bertanggung jawab untuk business rules terkait username
 * Berbeda dengan class-validator di DTO yang handle format input
 */
export class UsernameValidator {
  private static readonly MIN_LENGTH = 3;
  private static readonly MAX_LENGTH = 50;
  private static readonly PATTERN = /^[a-zA-Z0-9_]+$/;

  private static readonly RESERVED_USERNAMES = [
    'admin',
    'root',
    'system',
    'administrator',
    'superuser',
    'test',
    'demo',
    'null',
    'undefined',
    'api',
    'www',
    'mail',
    'ftp',
    'localhost',
  ];

  /**
   * Validate username against business rules
   * Returns sanitized username (trimmed and lowercased)
   */
  static validate(username: string): string {
    if (!username || username.trim().length === 0) {
      throw new BadRequestException('Username tidak boleh kosong');
    }

    const trimmed = username.trim().toLowerCase();

    // Check length
    if (trimmed.length < this.MIN_LENGTH) {
      throw new BadRequestException(
        `Username minimal ${this.MIN_LENGTH} karakter`,
      );
    }

    if (trimmed.length > this.MAX_LENGTH) {
      throw new BadRequestException(
        `Username maksimal ${this.MAX_LENGTH} karakter`,
      );
    }

    // Check pattern
    if (!this.PATTERN.test(trimmed)) {
      throw new BadRequestException(
        'Username hanya boleh mengandung huruf, angka, dan underscore',
      );
    }

    // Check reserved usernames
    if (this.isReserved(trimmed)) {
      throw new BadRequestException(
        `Username "${trimmed}" adalah nama yang direservasi sistem`,
      );
    }

    return trimmed;
  }

  /**
   * Check if username is reserved by system
   */
  static isReserved(username: string): boolean {
    return this.RESERVED_USERNAMES.includes(username.toLowerCase());
  }

  /**
   * Validate username format without throwing errors
   * Useful for conditional checks
   */
  static isValid(username: string): boolean {
    if (!username || username.trim().length === 0) return false;

    const trimmed = username.trim().toLowerCase();

    if (trimmed.length < this.MIN_LENGTH || trimmed.length > this.MAX_LENGTH) {
      return false;
    }

    if (!this.PATTERN.test(trimmed)) return false;
    if (this.isReserved(trimmed)) return false;

    return true;
  }
}
