import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fingerprint } from '../../domains/entities/fingerprint.entity';
import { CreateFingerprintDto } from '../dto/create-fingerprint.dto';
import { VerifyFingerprintDto } from '../dto/verify-fingerprint.dto';
import {
  FingerprintResponseDto,
  VerifyFingerprintResponseDto,
} from '../dto/fingerprint-response.dto';
import { FingerprintEnrollmentService } from '../use-cases/fingerprint-enrollment.service';
import { FingerprintVerificationService } from '../use-cases/fingerprint-verification.service';
import { FingerprintDeletionService } from '../use-cases/fingerprint-deletion.service';
import { FingerprintSyncService } from '../use-cases/fingerprint-sync.service';
import { FingerprintMapper } from '../../domains/mappers/fingerprint.mapper';
import { FingerprintCacheService } from '../../infrastructure/cache/fingerprint-cache.service';
import { FingerprintDeviceFactory } from '../../infrastructure/devices/fingerprint-device-factory';

@Injectable()
export class FingerprintsService {
  private readonly logger = new Logger(FingerprintsService.name);

  constructor(
    @InjectRepository(Fingerprint)
    private readonly fingerprintRepository: Repository<Fingerprint>,
    private readonly enrollmentService: FingerprintEnrollmentService,
    private readonly verificationService: FingerprintVerificationService,
    private readonly deletionService: FingerprintDeletionService,
    private readonly syncService: FingerprintSyncService,
    private readonly mapper: FingerprintMapper,
    private readonly cacheService: FingerprintCacheService,
    private readonly deviceFactory: FingerprintDeviceFactory,
  ) {}

  /**
   * Enroll new fingerprint
   */
  async enroll(dto: CreateFingerprintDto): Promise<FingerprintResponseDto> {
    this.logger.log(`📝 Enrolling fingerprint for patient #${dto.patient_id}`);
    return this.enrollmentService.execute(dto);
  }

  /**
   * Verify fingerprint (1:1 or 1:N)
   */
  async verify(
    dto: VerifyFingerprintDto,
  ): Promise<VerifyFingerprintResponseDto> {
    const mode = dto.patient_id ? '1:1' : '1:N';
    this.logger.log(`🔍 Verifying fingerprint (${mode} mode)`);
    return this.verificationService.execute(dto);
  }

  /**
   * Get fingerprints by patient
   */
  async findByPatient(patientId: string): Promise<FingerprintResponseDto[]> {
    this.logger.log(`🔍 Finding fingerprints for patient #${patientId}`);

    // Try to get from cache first
    const fingerprints =
      await this.cacheService.getPatientFingerprints(patientId);

    return this.mapper.toResponseDtoArray(fingerprints);
  }

  /**
   * Get single fingerprint by ID
   */
  async findOne(id: string): Promise<FingerprintResponseDto> {
    const fingerprint = await this.fingerprintRepository.findOne({
      where: { id, is_active: true },
    });

    if (!fingerprint) {
      throw new Error(`Sidik jari dengan ID #${id} tidak ditemukan`);
    }

    return this.mapper.toResponseDto(fingerprint);
  }

  /**
   * Delete fingerprint
   */
  async remove(id: string): Promise<{ message: string }> {
    this.logger.log(`🗑️ Deleting fingerprint #${id}`);
    return this.deletionService.execute(id);
  }

  /**
   * Delete all fingerprints for a patient
   */
  async removeByPatient(patientId: string): Promise<{ deleted: number }> {
    this.logger.log(`🗑️ Deleting all fingerprints for patient #${patientId}`);
    return this.deletionService.deleteByPatient(patientId);
  }

  /**
   * Get device status
   */
  async getDeviceStatus(): Promise<any> {
    this.logger.log('📱 Getting device status');
    return this.syncService.verifyDeviceConnection();
  }

  /**
   * Sync fingerprints to device
   */
  async syncToDevice(patientId?: string): Promise<any> {
    if (patientId) {
      this.logger.log(
        `🔄 Syncing fingerprints for patient #${patientId} to device`,
      );
      return this.syncService.syncPatientToDevice(patientId);
    }

    this.logger.log('🔄 Syncing all fingerprints to device');
    return this.syncService.syncAllToDevice();
  }

  /**
   * Sync fingerprints from device
   */
  async syncFromDevice(): Promise<any> {
    this.logger.log('🔄 Syncing fingerprints from device');
    return this.syncService.syncFromDevice();
  }

  /**
   * Clear device memory
   */
  async clearDevice(): Promise<any> {
    this.logger.log('🧹 Clearing device memory');
    return this.syncService.clearDevice();
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    byQuality: Record<string, number>;
    byPosition: Record<string, number>;
    totalVerifications: number;
  }> {
    const [total, active] = await Promise.all([
      this.fingerprintRepository.count(),
      this.fingerprintRepository.count({ where: { is_active: true } }),
    ]);

    const fingerprints = await this.fingerprintRepository.find({
      where: { is_active: true },
    });

    const byQuality: Record<string, number> = {};
    const byPosition: Record<string, number> = {};
    let totalVerifications = 0;

    fingerprints.forEach((fp) => {
      // Count by quality
      byQuality[fp.quality] = (byQuality[fp.quality] || 0) + 1;

      // Count by position
      byPosition[fp.finger_position] =
        (byPosition[fp.finger_position] || 0) + 1;

      // Sum verifications
      totalVerifications += fp.verification_count;
    });

    return {
      total,
      active,
      byQuality,
      byPosition,
      totalVerifications,
    };
  }

  /**
   * Capture fingerprint from device
   */
  async captureFromDevice(): Promise<{
    templateData: string;
    deviceInfo: any;
  }> {
    this.logger.log('📸 Capturing fingerprint from device');

    const device = this.deviceFactory.getDevice();

    if (!device.isConnected()) {
      await device.connect();
    }

    const templateData = await device.capture();
    const deviceInfo = await device.getDeviceInfo();

    return {
      templateData,
      deviceInfo,
    };
  }
}
