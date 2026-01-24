// domains/validators/user-data.validator.ts
import { BadRequestException } from '@nestjs/common';
import { isUUID } from 'class-validator';

export class UserDataValidator {
  /**
   * Validate nama lengkap
   */
  static validateNamaLengkap(nama: string): void {
    if (!nama || nama.trim().length === 0) {
      throw new BadRequestException('Nama lengkap tidak boleh kosong');
    }

    if (nama.length < 3) {
      throw new BadRequestException('Nama lengkap minimal 3 karakter');
    }

    if (nama.length > 250) {
      throw new BadRequestException('Nama lengkap maksimal 250 karakter');
    }

    // Only allow letters, spaces, and common name characters
    const namePattern = /^[a-zA-Z\s.''-]+$/;
    if (!namePattern.test(nama)) {
      throw new BadRequestException(
        'Nama lengkap hanya boleh mengandung huruf, spasi, dan karakter nama umum',
      );
    }
  }

  /**
   * Validate roles array
   */
  static validateRoles(roles: string[]): void {
    if (!roles || !Array.isArray(roles)) {
      throw new BadRequestException('Roles harus berupa array');
    }

    if (roles.length === 0) {
      throw new BadRequestException('User harus memiliki minimal 1 role');
    }

    // Check for duplicates
    const uniqueRoles = new Set(roles);
    if (uniqueRoles.size !== roles.length) {
      throw new BadRequestException('Roles tidak boleh duplikat');
    }

    // Validate all are positive integers
    for (const roleId of roles) {
      // Cek apakah string tersebut format UUID v4 yang valid
      if (!isUUID(roleId)) {
        throw new BadRequestException(
          `Role ID '${roleId}' tidak valid (harus berupa UUID)`,
        );
      }
    }
  }
}
