import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Fingerprint } from '../../domains/entities/fingerprint.entity';
import { FingerprintMapper } from '../../domains/mappers/fingerprint.mapper';
import { FingerprintCacheService } from '../../infrastructure/cache/fingerprint-cache.service';
import { FingerprintDeviceFactory } from '../../infrastructure/devices/fingerprint-device-factory';
import { CreateFingerprintDto } from '../dto/create-fingerprint.dto';
import {
  FingerprintResponseDto,
  VerifyFingerprintResponseDto,
} from '../dto/fingerprint-response.dto';
import { VerifyFingerprintDto } from '../dto/verify-fingerprint.dto';
import { FingerprintDeletionService } from '../use-cases/fingerprint-deletion.service';
import { FingerprintEnrollmentService } from '../use-cases/fingerprint-enrollment.service';
import { FingerprintSyncService } from '../use-cases/fingerprint-sync.service';
import { FingerprintVerificationService } from '../use-cases/fingerprint-verification.service';

// --- Interfaces & Types ---

export interface DeviceInfo {
  serialNumber?: string;
  firmwareVersion?: string;
  model?: string;
  isConnected: boolean;
  extraData?: Record<string, unknown>;
}

export interface SyncResult {
  success: boolean;
  message: string;
  syncedCount?: number;
  errors?: string[];
}

export interface CaptureResponse {
  templateData: string;
  deviceInfo: DeviceInfo;
}

export interface DeviceStatus {
  isConnected: boolean;
  message: string;
  details?: Record<string, unknown>;
}

export interface FingerprintStatistics {
  total: number;
  active: number;
  byQuality: Record<string, number>;
  byPosition: Record<string, number>;
  totalVerifications: number;
}

// Interface helper untuk menangani raw data dari library eksternal device
interface RawDeviceData {
  serialNumber?: string;
  firmwareVersion?: string;
  model?: string;
  isConnected?: boolean;
  [key: string]: unknown;
}

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
      throw new NotFoundException(`
        Sidik jari dengan ID #${id} tidak ditemukan`);
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
  async getDeviceStatus(): Promise<DeviceStatus> {
    this.logger.log('📱 Getting device status');

    const result = await this.syncService.verifyDeviceConnection();

    const deviceStatus: DeviceStatus = {
      isConnected: result.connected,
      message: result.connected ? 'Device connected' : 'Device not connected',
      details: result,
    };

    return deviceStatus;
  }

  /**
   * Sync fingerprints to device
   */
  async syncToDevice(patientId?: string): Promise<SyncResult> {
    if (patientId) {
      this.logger.log(`
        🔄 Syncing fingerprints for patient #${patientId} to device`);
      const result = await this.syncService.syncPatientToDevice(patientId);
      return { ...result, message: 'Sync patient to device completed' };
    }

    this.logger.log('🔄 Syncing all fingerprints to device');
    const result = await this.syncService.syncAllToDevice();
    return { ...result, message: 'Sync all fingerprints to device completed' };
  }

  /**
   * Sync fingerprints from device
   */
  async syncFromDevice(): Promise<SyncResult> {
    this.logger.log('🔄 Syncing fingerprints from device');
    const result = await this.syncService.syncFromDevice();
    return { ...result, message: 'Sync from device completed' };
  }

  /**
   * Clear device memory
   */
  async clearDevice(): Promise<SyncResult> {
    this.logger.log('🧹 Clearing device memory');
    return this.syncService.clearDevice();
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<FingerprintStatistics> {
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
      // Konversi ke string jika fp.quality bukan string
      const qualityKey = String(fp.quality);
      byQuality[qualityKey] = (byQuality[qualityKey] || 0) + 1;

      // Count by position
      // fp.finger_position kemungkinan Enum, kita ubah ke string untuk key object
      const positionKey = String(fp.finger_position);
      byPosition[positionKey] = (byPosition[positionKey] || 0) + 1;

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
  async captureFromDevice(): Promise<CaptureResponse> {
    this.logger.log('📸 Capturing fingerprint from device');

    const device = this.deviceFactory.getDevice();

    if (!device.isConnected()) {
      await device.connect();
    }

    const templateData: string = await device.capture();

    // Ambil raw info sebagai unknown terlebih dahulu
    const rawInfo: unknown = await device.getDeviceInfo();

    // Cast ke helper interface untuk akses properti yang aman
    const safeRawInfo = rawInfo as RawDeviceData;

    const deviceInfo: DeviceInfo = {
      serialNumber: safeRawInfo?.serialNumber,
      firmwareVersion: safeRawInfo?.firmwareVersion,
      model: safeRawInfo?.model,
      isConnected: safeRawInfo?.isConnected ?? true,
      // Mapping sisa data ke Record<string, unknown> jika perlu
      extraData:
        typeof rawInfo === 'object' && rawInfo !== null
          ? (rawInfo as Record<string, unknown>)
          : undefined,
    };

    return {
      templateData,
      deviceInfo,
    };
  }
}
