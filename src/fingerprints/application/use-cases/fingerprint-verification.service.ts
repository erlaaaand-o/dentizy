import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Fingerprint } from '../../domains/entities/fingerprint.entity';
import { Patient } from '../../../patients/domains/entities/patient.entity';
import { VerifyFingerprintDto } from '../dto/verify-fingerprint.dto';
import { VerifyFingerprintResponseDto } from '../dto/fingerprint-response.dto';
import { FingerprintDeviceFactory } from '../../infrastructure/devices/fingerprint-device-factory';
import { FingerprintVerifiedEvent } from '../../infrastructure/events/fingerprint-verified.event';

@Injectable()
export class FingerprintVerificationService {
  private readonly logger = new Logger(FingerprintVerificationService.name);
  private readonly DEFAULT_THRESHOLD = 70;

  constructor(
    @InjectRepository(Fingerprint)
    private readonly fingerprintRepository: Repository<Fingerprint>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    private readonly deviceFactory: FingerprintDeviceFactory,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    dto: VerifyFingerprintDto,
  ): Promise<VerifyFingerprintResponseDto> {
    const threshold = dto.threshold || this.DEFAULT_THRESHOLD;

    // 1:1 Verification (if patient_id provided)
    if (dto.patient_id) {
      return this.verifyOneToOne(dto, threshold);
    }

    // 1:N Verification (search all fingerprints)
    return this.verifyOneToMany(dto, threshold);
  }

  private async verifyOneToOne(
    dto: VerifyFingerprintDto,
    threshold: number,
  ): Promise<VerifyFingerprintResponseDto> {
    const fingerprints = await this.fingerprintRepository.find({
      where: {
        patient_id: dto.patient_id,
        is_active: true,
      },
      relations: ['patient'],
    });

    if (fingerprints.length === 0) {
      throw new NotFoundException(
        `Tidak ada sidik jari terdaftar untuk pasien ID #${dto.patient_id}`,
      );
    }

    return this.matchFingerprints(dto.template_data, fingerprints, threshold);
  }

  private async verifyOneToMany(
    dto: VerifyFingerprintDto,
    threshold: number,
  ): Promise<VerifyFingerprintResponseDto> {
    // Get all active fingerprints
    const fingerprints = await this.fingerprintRepository.find({
      where: { is_active: true },
      relations: ['patient'],
    });

    if (fingerprints.length === 0) {
      throw new NotFoundException(
        'Tidak ada sidik jari terdaftar dalam sistem',
      );
    }

    return this.matchFingerprints(dto.template_data, fingerprints, threshold);
  }

  private async matchFingerprints(
    templateData: string,
    fingerprints: Fingerprint[],
    threshold: number,
  ): Promise<VerifyFingerprintResponseDto> {
    let bestMatch: {
      fingerprint: Fingerprint;
      score: number;
    } | null = null;

    // Get matching device for verification
    const device = this.deviceFactory.getDevice();

    for (const fingerprint of fingerprints) {
      const score = await device.match(templateData, fingerprint.template_data);

      if (score >= threshold) {
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { fingerprint, score };
        }
      }
    }

    if (!bestMatch) {
      this.logger.warn('❌ Fingerprint verification failed - no match found');
      return {
        matched: false,
        patient_id: null,
        fingerprint_id: null,
        match_score: 0,
        confidence: 0,
        patient_name: null,
        medical_record_number: null,
      };
    }

    // Update verification statistics
    await this.updateVerificationStats(bestMatch.fingerprint);

    this.logger.log(
      `✅ Fingerprint verified: Patient #${bestMatch.fingerprint.patient_id} (score: ${bestMatch.score})`,
    );

    // Emit event
    this.eventEmitter.emit(
      'fingerprint.verified',
      new FingerprintVerifiedEvent(
        bestMatch.fingerprint,
        bestMatch.fingerprint.patient,
        bestMatch.score,
      ),
    );

    return {
      matched: true,
      patient_id: bestMatch.fingerprint.patient_id,
      fingerprint_id: bestMatch.fingerprint.id,
      match_score: bestMatch.score,
      confidence: this.calculateConfidence(bestMatch.score),
      patient_name: bestMatch.fingerprint.patient.nama_lengkap,
      medical_record_number: bestMatch.fingerprint.patient.nomor_rekam_medis,
    };
  }

  private async updateVerificationStats(
    fingerprint: Fingerprint,
  ): Promise<void> {
    fingerprint.verification_count++;
    fingerprint.last_verified_at = new Date();
    await this.fingerprintRepository.save(fingerprint);
  }

  private calculateConfidence(score: number): number {
    // Convert match score to confidence percentage
    return Math.min(100, Math.round((score / 100) * 100));
  }
}
