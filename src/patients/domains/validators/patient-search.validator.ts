import { Injectable, BadRequestException } from '@nestjs/common';
import { SearchPatientDto } from '../../application/dto/search-patient.dto';

@Injectable()
export class PatientSearchValidator {
  constructor() {}

  /**
   * Validate search query comprehensively
   */
  validate(query: SearchPatientDto): void {
    this.validateAgeRange(query.umur_min, query.umur_max);
    this.validateDateRange(
      query.tanggal_daftar_dari,
      query.tanggal_daftar_sampai,
    );
    this.validateSearchLength(query.search);
    this.validatePagination(query.page, query.limit);
  }

  /**
   * Validate age range logic
   */
  private validateAgeRange(minAge?: number, maxAge?: number): void {
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
   * Validate date range logic
   */
  private validateDateRange(dateFrom?: string, dateTo?: string): void {
    if (dateFrom && dateTo) {
      const from = new Date(dateFrom);
      const to = new Date(dateTo);

      if (isNaN(from.getTime()) || isNaN(to.getTime())) {
        throw new BadRequestException('Format tanggal tidak valid');
      }

      if (from > to) {
        throw new BadRequestException(
          'Tanggal dari tidak boleh lebih besar dari tanggal sampai',
        );
      }

      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

      if (from < tenYearsAgo) {
        throw new BadRequestException(
          'Pencarian tanggal maksimal 10 tahun ke belakang',
        );
      }
    }
  }

  /**
   * Validate search string length and security
   */
  private validateSearchLength(search?: string): void {
    if (search) {
      const trimmed = search.trim();

      if (trimmed.length < 2) {
        throw new BadRequestException('Pencarian minimal 2 karakter');
      }

      if (trimmed.length > 255) {
        throw new BadRequestException('Pencarian maksimal 255 karakter');
      }

      // Check for SQL injection patterns
      const dangerousPatterns =
        /(\bSELECT\b|\bDROP\b|\bDELETE\b|\bINSERT\b|\bUPDATE\b|\bUNION\b)/gi;
      if (dangerousPatterns.test(trimmed)) {
        throw new BadRequestException(
          'Pencarian mengandung karakter tidak valid',
        );
      }
    }
  }

  /**
   * Validate pagination parameters
   */
  private validatePagination(page?: number, limit?: number): void {
    if (page !== undefined && page < 1) {
      throw new BadRequestException('Page harus lebih besar dari 0');
    }

    if (limit !== undefined) {
      if (limit < 1) {
        throw new BadRequestException('Limit harus lebih besar dari 0');
      }

      if (limit > 100) {
        throw new BadRequestException('Limit maksimal 100');
      }
    }
  }
}
