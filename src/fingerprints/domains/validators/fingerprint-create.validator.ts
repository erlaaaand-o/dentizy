import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFingerprintDto } from '../../application/dto/create-fingerprint.dto';
import {
  Fingerprint,
  FingerPosition,
  FingerprintQuality,
} from '../entities/fingerprint.entity';
import { Patient } from '../../../patients/domains/entities/patient.entity';

@Injectable()
export class FingerprintCreateValidator {
  private readonly MIN_TEMPLATE_LENGTH = 100;
  private readonly MAX_TEMPLATE_LENGTH = 10000;
  private readonly MIN_MATCH_SCORE = 0;
  private readonly MAX_MATCH_SCORE = 100;
  private readonly MAX_NOTES_LENGTH = 500;
  private readonly MAX_DEVICE_ID_LENGTH = 100;
  private readonly MAX_DEVICE_MODEL_LENGTH = 50;

  constructor(
    @InjectRepository(Fingerprint)
    private readonly fingerprintRepository: Repository<Fingerprint>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  /**
   * Validate enrollment data comprehensively
   */
  async validateEnrollment(dto: CreateFingerprintDto): Promise<void> {
    // Validate patient existence
    await this.validatePatientExists(dto.patient_id);

    // Validate template data
    this.validateTemplateData(dto.template_data);

    // Validate finger position
    this.validateFingerPosition(dto.finger_position);

    // Validate no duplicate enrollment
    await this.validateNoDuplicate(dto.patient_id, dto.finger_position);

    // Validate optional fields
    if (dto.device_id) {
      this.validateDeviceId(dto.device_id);
    }

    if (dto.device_model) {
      this.validateDeviceModel(dto.device_model);
    }

    if (dto.quality) {
      this.validateQuality(dto.quality);
    }

    if (dto.match_score !== undefined) {
      this.validateMatchScore(dto.match_score);
    }

    if (dto.notes) {
      this.validateNotes(dto.notes);
    }
  }

  /**
   * Validate patient exists in database
   */
  private async validatePatientExists(patientId: string): Promise<void> {
    if (!patientId) {
      throw new BadRequestException('Patient ID harus berupa angka positif');
    }

    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
    });

    if (!patient) {
      throw new BadRequestException(
        `Pasien dengan ID #${patientId} tidak ditemukan dalam sistem`,
      );
    }

    // Additional validation: check if patient is active
    if (patient.is_active === false) {
      throw new BadRequestException(
        `Pasien dengan ID #${patientId} tidak aktif. Aktifkan pasien terlebih dahulu.`,
      );
    }
  }

  /**
   * Validate template data format and length
   */
  private validateTemplateData(templateData: string): void {
    if (!templateData || templateData.trim().length === 0) {
      throw new BadRequestException('Template data tidak boleh kosong');
    }

    // Check length
    if (templateData.length < this.MIN_TEMPLATE_LENGTH) {
      throw new BadRequestException(
        `Template data terlalu pendek. Minimal ${this.MIN_TEMPLATE_LENGTH} karakter, diterima ${templateData.length} karakter`,
      );
    }

    if (templateData.length > this.MAX_TEMPLATE_LENGTH) {
      throw new BadRequestException(
        `Template data terlalu panjang. Maksimal ${this.MAX_TEMPLATE_LENGTH} karakter, diterima ${templateData.length} karakter`,
      );
    }

    // Validate Base64 format
    if (!this.isValidBase64(templateData)) {
      throw new BadRequestException(
        'Template data harus dalam format Base64 yang valid. Pastikan data telah di-encode dengan benar.',
      );
    }

    // Check for common Base64 issues
    if (templateData.includes(' ')) {
      throw new BadRequestException(
        'Template data tidak boleh mengandung spasi. Pastikan Base64 encoding tidak mengandung whitespace.',
      );
    }
  }

  /**
   * Validate finger position
   */
  private validateFingerPosition(fingerPosition: FingerPosition): void {
    const validPositions = Object.values(FingerPosition);

    if (!validPositions.includes(fingerPosition)) {
      throw new BadRequestException(
        `Posisi jari tidak valid. Pilihan yang tersedia: ${validPositions.join(', ')}`,
      );
    }
  }

  /**
   * Validate no duplicate enrollment for same finger
   */
  private async validateNoDuplicate(
    patientId: string,
    fingerPosition: FingerPosition,
  ): Promise<void> {
    const existing = await this.fingerprintRepository.findOne({
      where: {
        patient_id: patientId,
        finger_position: fingerPosition,
        is_active: true,
      },
    });

    if (existing) {
      const displayName = this.getFingerDisplayName(fingerPosition);
      throw new BadRequestException(
        `Sidik jari ${displayName} untuk pasien ini sudah terdaftar. ` +
          `Hapus sidik jari lama terlebih dahulu atau gunakan jari yang berbeda.`,
      );
    }
  }

  /**
   * Validate device ID
   */
  private validateDeviceId(deviceId: string): void {
    if (deviceId.length > this.MAX_DEVICE_ID_LENGTH) {
      throw new BadRequestException(
        `Device ID terlalu panjang. Maksimal ${this.MAX_DEVICE_ID_LENGTH} karakter`,
      );
    }

    // Check for valid characters (alphanumeric, dash, underscore)
    const validPattern = /^[a-zA-Z0-9\-_]+$/;
    if (!validPattern.test(deviceId)) {
      throw new BadRequestException(
        'Device ID hanya boleh mengandung huruf, angka, dash (-), dan underscore (_)',
      );
    }
  }

  /**
   * Validate device model
   */
  private validateDeviceModel(deviceModel: string): void {
    if (deviceModel.length > this.MAX_DEVICE_MODEL_LENGTH) {
      throw new BadRequestException(
        `Device model terlalu panjang. Maksimal ${this.MAX_DEVICE_MODEL_LENGTH} karakter`,
      );
    }
  }

  /**
   * Validate quality enum
   */
  private validateQuality(quality: FingerprintQuality): void {
    const validQualities = Object.values(FingerprintQuality);

    if (!validQualities.includes(quality)) {
      throw new BadRequestException(
        `Kualitas tidak valid. Pilihan: ${validQualities.join(', ')}`,
      );
    }
  }

  /**
   * Validate match score range
   */
  private validateMatchScore(matchScore: number): void {
    if (
      matchScore < this.MIN_MATCH_SCORE ||
      matchScore > this.MAX_MATCH_SCORE
    ) {
      throw new BadRequestException(
        `Match score harus antara ${this.MIN_MATCH_SCORE}-${this.MAX_MATCH_SCORE}`,
      );
    }
  }

  /**
   * Validate notes length
   */
  private validateNotes(notes: string): void {
    if (notes.length > this.MAX_NOTES_LENGTH) {
      throw new BadRequestException(
        `Catatan terlalu panjang. Maksimal ${this.MAX_NOTES_LENGTH} karakter`,
      );
    }
  }

  /**
   * Check if patient has reached maximum fingerprints
   */
  async validateMaxFingerprintsPerPatient(patientId: string): Promise<void> {
    const MAX_FINGERPRINTS = 10; // All 10 fingers

    const count = await this.fingerprintRepository.count({
      where: {
        patient_id: patientId,
        is_active: true,
      },
    });

    if (count >= MAX_FINGERPRINTS) {
      throw new BadRequestException(
        `Pasien sudah mencapai batas maksimal ${MAX_FINGERPRINTS} sidik jari. ` +
          `Hapus sidik jari lama untuk mendaftarkan yang baru.`,
      );
    }
  }

  /**
   * Validate template quality meets minimum requirements
   */
  validateTemplateQuality(
    quality: FingerprintQuality,
    matchScore: number,
  ): void {
    const MIN_ACCEPTABLE_SCORE = 50;

    if (
      quality === FingerprintQuality.POOR &&
      matchScore < MIN_ACCEPTABLE_SCORE
    ) {
      throw new BadRequestException(
        `Kualitas template terlalu rendah (${matchScore}%). ` +
          `Silakan scan ulang dengan kualitas yang lebih baik (minimal ${MIN_ACCEPTABLE_SCORE}%).`,
      );
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
   * Get user-friendly display name for finger position
   */
  private getFingerDisplayName(position: FingerPosition): string {
    const displayNames: Record<FingerPosition, string> = {
      [FingerPosition.LEFT_THUMB]: 'Jempol Kiri',
      [FingerPosition.LEFT_INDEX]: 'Telunjuk Kiri',
      [FingerPosition.LEFT_MIDDLE]: 'Jari Tengah Kiri',
      [FingerPosition.LEFT_RING]: 'Jari Manis Kiri',
      [FingerPosition.LEFT_LITTLE]: 'Kelingking Kiri',
      [FingerPosition.RIGHT_THUMB]: 'Jempol Kanan',
      [FingerPosition.RIGHT_INDEX]: 'Telunjuk Kanan',
      [FingerPosition.RIGHT_MIDDLE]: 'Jari Tengah Kanan',
      [FingerPosition.RIGHT_RING]: 'Jari Manis Kanan',
      [FingerPosition.RIGHT_LITTLE]: 'Kelingking Kanan',
    };

    return displayNames[position] || position;
  }

  /**
   * Batch validation for multiple enrollments
   */
  async validateBatchEnrollment(dtos: CreateFingerprintDto[]): Promise<void> {
    if (!dtos || dtos.length === 0) {
      throw new BadRequestException('Data enrollment tidak boleh kosong');
    }

    const MAX_BATCH_SIZE = 10;
    if (dtos.length > MAX_BATCH_SIZE) {
      throw new BadRequestException(
        `Maksimal ${MAX_BATCH_SIZE} enrollment per batch`,
      );
    }

    // Check for duplicates in batch
    const fingerPositions = dtos.map(
      (dto) => `${dto.patient_id}-${dto.finger_position}`,
    );
    const uniquePositions = new Set(fingerPositions);

    if (fingerPositions.length !== uniquePositions.size) {
      throw new BadRequestException(
        'Terdapat duplikasi posisi jari dalam batch enrollment',
      );
    }

    // Validate each DTO
    for (const dto of dtos) {
      await this.validateEnrollment(dto);
    }
  }
}
