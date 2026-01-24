import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class PatientFieldValidator {
  /**
   * Validate age range logic
   */
  validateAgeRange(minAge?: number, maxAge?: number): void {
    if (minAge !== undefined && maxAge !== undefined) {
      if (minAge > maxAge) {
        throw new BadRequestException(
          'Umur minimal tidak boleh lebih besar dari umur maksimal',
        );
      }

      if (minAge < 0 || maxAge < 0) {
        throw new BadRequestException('Umur tidak boleh negatif');
      }

      if (minAge > 150 || maxAge > 150) {
        throw new BadRequestException('Umur tidak valid (maksimal 150 tahun)');
      }
    }
  }

  /**
   * Validate birth date business rules
   */
  validateBirthDate(birthDate?: string | Date): void {
    if (!birthDate) return;

    const date =
      typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(date.getTime())) {
      throw new BadRequestException('Format tanggal lahir tidak valid');
    }

    if (date > today) {
      throw new BadRequestException('Tanggal lahir tidak boleh di masa depan');
    }

    const maxYearsAgo = new Date();
    maxYearsAgo.setFullYear(maxYearsAgo.getFullYear() - 150);

    if (date < maxYearsAgo) {
      throw new BadRequestException(
        'Tanggal lahir tidak valid (lebih dari 150 tahun yang lalu)',
      );
    }
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phone?: string): void {
    if (!phone) return;

    const phoneRegex = /^(\+62|62|0)[0-9]{9,13}$/;

    if (!phoneRegex.test(phone)) {
      throw new BadRequestException(
        'Format nomor HP tidak valid (contoh: 081234567890 atau +628123456789)',
      );
    }

    // Check for repeated digits (likely fake number)
    const repeatedPattern = /(\d)\1{9,}/;
    if (repeatedPattern.test(phone)) {
      throw new BadRequestException(
        'Nomor HP tidak valid (terlalu banyak digit yang sama)',
      );
    }
  }

  /**
   * Validate email format (basic check)
   */
  validateEmail(email?: string): void {
    if (!email) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      throw new BadRequestException('Format email tidak valid');
    }

    if (email.length > 250) {
      throw new BadRequestException('Email maksimal 250 karakter');
    }
  }

  /**
   * Validate NIK format (16 digits)
   */
  validateNik(nik?: string): void {
    if (!nik) return;

    if (nik.length !== 16) {
      throw new BadRequestException('NIK harus 16 digit');
    }

    if (!/^\d{16}$/.test(nik)) {
      throw new BadRequestException('NIK harus berupa 16 digit angka');
    }
  }

  /**
   * Validate text length
   */
  validateTextLength(
    text: string | undefined,
    fieldName: string,
    maxLength: number,
  ): void {
    if (!text) return;

    if (text.length > maxLength) {
      throw new BadRequestException(
        `${fieldName} maksimal ${maxLength} karakter`,
      );
    }
  }

  /**
   * Validate required field
   */
  validateRequired<T>(value: T, fieldName: string): void {
    if (value === undefined || value === null || value === '') {
      throw new BadRequestException(`${fieldName} harus diisi`);
    }
  }
}
