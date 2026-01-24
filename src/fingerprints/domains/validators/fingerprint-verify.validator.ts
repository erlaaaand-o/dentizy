import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VerifyFingerprintDto } from '../../application/dto/verify-fingerprint.dto';
import { Fingerprint } from '../entities/fingerprint.entity';
import { Patient } from '../../../patients/domains/entities/patient.entity';

@Injectable()
export class FingerprintVerifyValidator {
  private readonly MIN_TEMPLATE_LENGTH = 100;
  private readonly MAX_TEMPLATE_LENGTH = 10000;
  private readonly MIN_THRESHOLD = 0;
  private readonly MAX_THRESHOLD = 100;
  private readonly DEFAULT_THRESHOLD = 70;
  private readonly RECOMMENDED_MIN_THRESHOLD = 60;
  private readonly RECOMMENDED_MAX_THRESHOLD = 90;

  constructor(
    @InjectRepository(Fingerprint)
    private readonly fingerprintRepository: Repository<Fingerprint>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  /**
   * Validate verification request comprehensively
   */
  async validateVerification(dto: VerifyFingerprintDto): Promise<void> {
    // Validate template data
    this.validateTemplateData(dto.template_data);

    // Validate threshold
    this.validateThreshold(dto.threshold);

    // If patient_id provided, validate 1:1 verification
    if (dto.patient_id) {
      await this.validate1to1Verification(dto.patient_id);
    } else {
      // Validate 1:N verification
      await this.validate1toNVerification();
    }
  }

  /**
   * Validate template data format and length
   */
  private validateTemplateData(templateData: string): void {
    if (!templateData || templateData.trim().length === 0) {
      throw new BadRequestException(
        'Template data tidak boleh kosong. Pastikan sidik jari telah di-scan dengan benar.',
      );
    }

    // Check length
    if (templateData.length < this.MIN_TEMPLATE_LENGTH) {
      throw new BadRequestException(
        `Template data terlalu pendek. Minimal ${this.MIN_TEMPLATE_LENGTH} karakter, diterima ${templateData.length} karakter. ` +
          `Silakan scan ulang sidik jari dengan kualitas yang lebih baik.`,
      );
    }

    if (templateData.length > this.MAX_TEMPLATE_LENGTH) {
      throw new BadRequestException(
        `Template data terlalu panjang. Maksimal ${this.MAX_TEMPLATE_LENGTH} karakter, diterima ${templateData.length} karakter. ` +
          `Data mungkin rusak atau tidak valid.`,
      );
    }

    // Validate Base64 format
    if (!this.isValidBase64(templateData)) {
      throw new BadRequestException(
        'Template data harus dalam format Base64 yang valid. ' +
          'Pastikan data telah di-encode dengan benar dan tidak mengandung karakter yang tidak diizinkan.',
      );
    }

    // Check for common issues
    if (templateData.includes(' ') || templateData.includes('\n')) {
      throw new BadRequestException(
        'Template data tidak boleh mengandung spasi atau newline. ' +
          'Pastikan Base64 encoding tidak mengandung whitespace.',
      );
    }
  }

  /**
   * Validate threshold value
   */
  private validateThreshold(threshold?: number): void {
    const effectiveThreshold = threshold ?? this.DEFAULT_THRESHOLD;

    // Check range
    if (
      effectiveThreshold < this.MIN_THRESHOLD ||
      effectiveThreshold > this.MAX_THRESHOLD
    ) {
      throw new BadRequestException(
        `Threshold harus antara ${this.MIN_THRESHOLD}-${this.MAX_THRESHOLD}. ` +
          `Nilai yang diterima: ${effectiveThreshold}`,
      );
    }

    // Warn if threshold is outside recommended range
    if (effectiveThreshold < this.RECOMMENDED_MIN_THRESHOLD) {
      console.warn(
        `⚠️ Threshold ${effectiveThreshold} di bawah nilai rekomendasi (${this.RECOMMENDED_MIN_THRESHOLD}). ` +
          `Ini dapat meningkatkan False Acceptance Rate (FAR).`,
      );
    }

    if (effectiveThreshold > this.RECOMMENDED_MAX_THRESHOLD) {
      console.warn(
        `⚠️ Threshold ${effectiveThreshold} di atas nilai rekomendasi (${this.RECOMMENDED_MAX_THRESHOLD}). ` +
          `Ini dapat meningkatkan False Rejection Rate (FRR).`,
      );
    }
  }

  /**
   * Validate 1:1 verification (with patient_id)
   */
  private async validate1to1Verification(patientId: string): Promise<void> {
    if (!patientId) {
      throw new BadRequestException(
        'Patient ID harus berupa angka positif yang valid',
      );
    }

    // Check if patient exists
    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
    });

    if (!patient) {
      throw new BadRequestException(
        `Pasien dengan ID #${patientId} tidak ditemukan dalam sistem. ` +
          `Pastikan ID pasien benar atau gunakan mode identifikasi (1:N).`,
      );
    }

    // Check if patient is active
    if (patient.is_active === false) {
      throw new BadRequestException(
        `Pasien dengan ID #${patientId} tidak aktif. ` +
          `Aktifkan pasien terlebih dahulu untuk melakukan verifikasi.`,
      );
    }

    // Check if patient has enrolled fingerprints
    const fingerprintCount = await this.fingerprintRepository.count({
      where: {
        patient_id: patientId,
        is_active: true,
      },
    });

    if (fingerprintCount === 0) {
      throw new BadRequestException(
        `Tidak ada sidik jari terdaftar untuk pasien #${patientId}. ` +
          `Daftarkan sidik jari terlebih dahulu sebelum melakukan verifikasi.`,
      );
    }
  }

  /**
   * Validate 1:N verification (without patient_id)
   */
  private async validate1toNVerification(): Promise<void> {
    // Check if there are any fingerprints in the system
    const totalFingerprints = await this.fingerprintRepository.count({
      where: { is_active: true },
    });

    if (totalFingerprints === 0) {
      throw new BadRequestException(
        'Tidak ada sidik jari terdaftar dalam sistem. ' +
          'Daftarkan sidik jari minimal satu pasien sebelum melakukan identifikasi.',
      );
    }

    // Warn if database is too large for 1:N
    const MAX_RECOMMENDED_1N = 1000;
    if (totalFingerprints > MAX_RECOMMENDED_1N) {
      console.warn(
        `⚠️ Database memiliki ${totalFingerprints} sidik jari (>${MAX_RECOMMENDED_1N}). ` +
          `Pertimbangkan untuk menggunakan verifikasi 1:1 untuk performa optimal.`,
      );
    }
  }

  /**
   * Validate verification rate limiting
   */
  async validateRateLimit(
    identifier: string,
    maxAttempts: number = 5,
    windowMinutes: number = 5,
  ): Promise<void> {
    // This is a placeholder for rate limiting logic
    // In production, integrate with Redis or similar
    // Example logic:
    // const attempts = await this.getRecentAttempts(identifier, windowMinutes);
    // if (attempts >= maxAttempts) {
    //     throw new BadRequestException(
    //         `Terlalu banyak percobaan verifikasi. ` +
    //         `Silakan coba lagi dalam ${windowMinutes} menit.`
    //     );
    // }
  }

  /**
   * Validate template quality for verification
   */
  validateTemplateQualityForVerification(
    templateData: string,
    minQualityScore: number = 50,
  ): void {
    // Calculate a simple quality score based on template characteristics
    const qualityScore = this.calculateTemplateQuality(templateData);

    if (qualityScore < minQualityScore) {
      throw new BadRequestException(
        `Kualitas template terlalu rendah (${qualityScore}%). ` +
          `Minimal ${minQualityScore}% diperlukan untuk verifikasi yang akurat. ` +
          `Silakan scan ulang dengan jari yang bersih dan kering.`,
      );
    }
  }

  /**
   * Validate biometric liveness (anti-spoofing)
   */
  validateLiveness(templateData: string, livenessScore?: number): void {
    if (livenessScore !== undefined) {
      const MIN_LIVENESS_SCORE = 80;

      if (livenessScore < MIN_LIVENESS_SCORE) {
        throw new BadRequestException(
          `Deteksi liveness gagal (score: ${livenessScore}%). ` +
            `Pastikan menggunakan jari asli, bukan foto atau replika.`,
        );
      }
    }
  }

  /**
   * Validate verification context (time, location, etc.)
   */
  validateVerificationContext(context?: {
    deviceId?: string;
    location?: string;
    timestamp?: Date;
  }): void {
    if (!context) return;

    // Validate timestamp (not too old)
    if (context.timestamp) {
      const MAX_AGE_MINUTES = 5;
      const age = Date.now() - context.timestamp.getTime();
      const ageMinutes = age / (1000 * 60);

      if (ageMinutes > MAX_AGE_MINUTES) {
        throw new BadRequestException(
          `Template data terlalu lama (${Math.round(ageMinutes)} menit). ` +
            `Maksimal ${MAX_AGE_MINUTES} menit. Silakan scan ulang.`,
        );
      }
    }

    // Validate device ID format
    if (context.deviceId) {
      const validPattern = /^[a-zA-Z0-9\-_]+$/;
      if (!validPattern.test(context.deviceId)) {
        throw new BadRequestException(
          'Device ID tidak valid. Harus berupa alphanumeric dengan dash/underscore.',
        );
      }
    }
  }

  /**
   * Batch verification validation
   */
  async validateBatchVerification(dtos: VerifyFingerprintDto[]): Promise<void> {
    if (!dtos || dtos.length === 0) {
      throw new BadRequestException('Data verifikasi tidak boleh kosong');
    }

    const MAX_BATCH_SIZE = 100;
    if (dtos.length > MAX_BATCH_SIZE) {
      throw new BadRequestException(
        `Maksimal ${MAX_BATCH_SIZE} verifikasi per batch. Diterima: ${dtos.length}`,
      );
    }

    // Validate each DTO
    for (let i = 0; i < dtos.length; i++) {
      try {
        await this.validateVerification(dtos[i]);
      } catch (error) {
        throw new BadRequestException(
          `Validasi gagal pada index ${i}: ${error.message}`,
        );
      }
    }
  }

  /**
   * Check if Base64 string is valid
   */
  private isValidBase64(str: string): boolean {
    try {
      // Check pattern
      const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Pattern.test(str)) {
        return false;
      }

      // Try to decode
      const decoded = Buffer.from(str, 'base64');
      const reEncoded = decoded.toString('base64');

      // Remove padding for comparison
      const strWithoutPadding = str.replace(/=+$/, '');
      const reEncodedWithoutPadding = reEncoded.replace(/=+$/, '');

      return strWithoutPadding === reEncodedWithoutPadding;
    } catch {
      return false;
    }
  }

  /**
   * Calculate template quality score (simplified)
   */
  private calculateTemplateQuality(templateData: string): number {
    // This is a simplified quality check
    // In production, use actual biometric quality assessment

    let score = 100;

    // Penalize if too short
    if (templateData.length < 200) {
      score -= 30;
    }

    // Check for repeating patterns (indicates poor quality)
    const uniqueChars = new Set(templateData).size;
    const diversity = (uniqueChars / templateData.length) * 100;

    if (diversity < 30) {
      score -= 20; // Too repetitive
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Validate threshold based on security level
   */
  validateThresholdForSecurityLevel(
    threshold: number,
    securityLevel: 'low' | 'medium' | 'high' | 'critical',
  ): void {
    const minThresholds = {
      low: 50,
      medium: 65,
      high: 75,
      critical: 85,
    };

    const minRequired = minThresholds[securityLevel];

    if (threshold < minRequired) {
      throw new BadRequestException(
        `Threshold terlalu rendah untuk security level '${securityLevel}'. ` +
          `Minimal ${minRequired}% diperlukan, diterima ${threshold}%.`,
      );
    }
  }

  /**
   * Validate concurrent verification limit
   */
  async validateConcurrentVerifications(
    currentActive: number,
    maxConcurrent: number = 10,
  ): Promise<void> {
    if (currentActive >= maxConcurrent) {
      throw new BadRequestException(
        `Terlalu banyak verifikasi concurrent (${currentActive}/${maxConcurrent}). ` +
          `Silakan tunggu beberapa saat dan coba lagi.`,
      );
    }
  }

  /**
   * Get recommended threshold based on use case
   */
  getRecommendedThreshold(
    useCase: 'attendance' | 'payment' | 'access' | 'medical',
  ): number {
    const recommendations = {
      attendance: 70, // Standard
      payment: 80, // Higher security
      access: 75, // Medium-high
      medical: 85, // Critical
    };

    return recommendations[useCase] || this.DEFAULT_THRESHOLD;
  }
}
