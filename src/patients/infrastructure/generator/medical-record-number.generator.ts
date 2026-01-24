import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Patient } from '../../domains/entities/patient.entity';

interface DatabaseError {
  code?: string;
  errno?: string | number;
  message?: string;
}

// Definisikan tipe result untuk nomor rekam medis
interface MedicalRecordResult {
  nomor_rekam_medis?: string;
}

@Injectable()
export class MedicalRecordNumberGenerator {
  private readonly logger = new Logger(MedicalRecordNumberGenerator.name);
  private readonly MAX_RETRIES = 5;
  private readonly MAX_DAILY_PATIENTS = 999;

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Generate nomor rekam medis dengan format: YYYYMMDD-XXX
   * Dengan atomic operation dan retry mechanism untuk high concurrency
   */
  async generate(): Promise<string> {
    const datePrefix = this.getDatePrefix();
    let attempt = 0;

    while (attempt < this.MAX_RETRIES) {
      attempt++;

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Lock table untuk generate sequence yang unik
        const result = await queryRunner.manager
          .createQueryBuilder(Patient, 'patient')
          .select('patient.nomor_rekam_medis', 'nomor_rekam_medis')
          .where('patient.nomor_rekam_medis LIKE :pattern', {
            pattern: `${datePrefix}-%`,
          })
          .orderBy('patient.nomor_rekam_medis', 'DESC')
          .limit(1)
          .setLock('pessimistic_write') // Lock untuk concurrency
          .getRawOne();

        const nextSequence = this.calculateNextSequence(result, datePrefix);

        if (nextSequence > this.MAX_DAILY_PATIENTS) {
          await queryRunner.rollbackTransaction();
          throw new InternalServerErrorException(
            `Maximum daily patient registrations exceeded (${this.MAX_DAILY_PATIENTS})`,
          );
        }

        const nomorRekamMedis = this.formatMedicalRecordNumber(
          datePrefix,
          nextSequence,
        );

        await queryRunner.commitTransaction();

        this.logger.log(
          `📋 Generated medical record number: ${nomorRekamMedis}`,
        );

        return nomorRekamMedis;
      } catch (error) {
        await queryRunner.rollbackTransaction();

        // Retry on deadlock or lock timeout
        if (this.isRetryableError(error) && attempt < this.MAX_RETRIES) {
          const backoffMs = Math.min(100 * Math.pow(2, attempt - 1), 1000);
          this.logger.warn(
            `⚠️ Retry attempt ${attempt}/${this.MAX_RETRIES} after ${backoffMs}ms`,
          );
          await this.sleep(backoffMs);
          continue;
        }

        this.logger.error('❌ Error generating medical record number:', error);
        throw new InternalServerErrorException(
          'Gagal generate nomor rekam medis. Silakan coba lagi.',
        );
      } finally {
        await queryRunner.release();
      }
    }

    throw new InternalServerErrorException(
      'Gagal generate nomor rekam medis setelah beberapa percobaan',
    );
  }

  /**
   * Get date prefix: YYYYMMDD
   */
  private getDatePrefix(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Calculate next sequence number
   */
  private calculateNextSequence(
    result: MedicalRecordResult | null,
    datePrefix: string,
  ): number {
    if (!result?.nomor_rekam_medis) {
      return 1;
    }

    const parts = result.nomor_rekam_medis.split('-');

    if (parts.length === 2 && parts[0] === datePrefix) {
      const lastSequence = parseInt(parts[1], 10);

      if (!isNaN(lastSequence) && lastSequence >= 1 && lastSequence <= 999) {
        return lastSequence + 1;
      }
    }

    // If parsing fails or invalid, start from 1
    return 1;
  }

  /**
   * Format medical record number
   */
  private formatMedicalRecordNumber(
    datePrefix: string,
    sequence: number,
  ): string {
    const sequenceStr = sequence.toString().padStart(3, '0');
    return `${datePrefix}-${sequenceStr}`;
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: DatabaseError): boolean {
    const retryableCodes = [1213, 1205];

    const errorCode: number =
      typeof error.errno === 'number' ? error.errno : -1;
    const errorMessage = error.message?.toLowerCase() || '';

    return (
      retryableCodes.includes(errorCode) ||
      errorMessage.includes('deadlock') ||
      errorMessage.includes('lock wait timeout')
    );
  }

  /**
   * Sleep helper untuk retry backoff
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Validate medical record number format
   */
  static isValidFormat(number: string): boolean {
    const pattern = /^\d{8}-\d{3}$/;
    return pattern.test(number);
  }

  /**
   * Parse medical record number
   */
  static parse(number: string): { date: Date; sequence: number } | null {
    if (!this.isValidFormat(number)) {
      return null;
    }

    const [dateStr, seqStr] = number.split('-');
    const year = parseInt(dateStr.substring(0, 4), 10);
    const month = parseInt(dateStr.substring(4, 6), 10) - 1;
    const day = parseInt(dateStr.substring(6, 8), 10);
    const sequence = parseInt(seqStr, 10);

    const date = new Date(year, month, day);

    if (isNaN(date.getTime()) || isNaN(sequence)) {
      return null;
    }

    return { date, sequence };
  }

  /**
   * Get statistics untuk monitoring
   */
  async getDailyStatistics(date?: Date): Promise<{
    total: number;
    remaining: number;
    percentage: number;
  }> {
    const targetDate = date || new Date();
    const datePrefix = this.formatDate(targetDate);

    const count = await this.dataSource
      .getRepository(Patient)
      .createQueryBuilder('patient')
      .where('patient.nomor_rekam_medis LIKE :pattern', {
        pattern: `${datePrefix}-%`,
      })
      .getCount();

    const remaining = this.MAX_DAILY_PATIENTS - count;
    const percentage = (count / this.MAX_DAILY_PATIENTS) * 100;

    return {
      total: count,
      remaining: remaining > 0 ? remaining : 0,
      percentage: Math.round(percentage * 100) / 100,
    };
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
  }
}
