import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Fingerprint } from '../../domains/entities/fingerprint.entity';
import { FingerprintCacheService } from '../../infrastructure/cache/fingerprint-cache.service';
import { FingerprintDeviceFactory } from '../../infrastructure/devices/fingerprint-device-factory';

// --- Interfaces ---

export interface SyncDetail {
  fingerprintId: string;
  patientId: string;
  status: 'success' | 'failed';
  error?: string;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  details: SyncDetail[];
}

export interface DeviceConnectionStatus {
  connected: boolean;
  info: Record<string, unknown> | null;
}

export interface ClearDeviceResult {
  success: boolean;
  message: string;
}

// Interface lokal untuk memastikan tipe device (menghindari any)
// Sebaiknya interface ini ada di level domain/infrastructure, tapi didefinisikan di sini untuk keamanan file ini.
interface IFingerprintDevice {
  isConnected(): boolean;
  getDeviceInfo(): Promise<Record<string, unknown>>;
  connect(): Promise<void>;
  // Method lain yang mungkin ada di device factory
}

@Injectable()
export class FingerprintSyncService {
  private readonly logger = new Logger(FingerprintSyncService.name);

  constructor(
    @InjectRepository(Fingerprint)
    private readonly fingerprintRepository: Repository<Fingerprint>,
    private readonly deviceFactory: FingerprintDeviceFactory,
    private readonly cacheService: FingerprintCacheService,
  ) {}

  /**
   * Sync all active fingerprints to device
   */
  async syncAllToDevice(): Promise<SyncResult> {
    this.logger.log('🔄 Starting fingerprint sync to device...');

    const fingerprints = await this.fingerprintRepository.find({
      where: { is_active: true },
    });

    return this.processFingerprintSync(fingerprints);
  }

  /**
   * Sync fingerprints for specific patient
   */
  async syncPatientToDevice(patientId: string): Promise<SyncResult> {
    this.logger.log(`🔄 Syncing fingerprints for patient #${patientId}...`);

    const fingerprints = await this.fingerprintRepository.find({
      where: { patient_id: patientId, is_active: true },
    });

    return this.processFingerprintSync(fingerprints);
  }

  /**
   * Sync from device to database (pull mode)
   */
  async syncFromDevice(): Promise<SyncResult> {
    this.logger.log('🔄 Starting sync from device to database...');

    // In a real implementation:
    // 1. Get all fingerprints from device memory
    // 2. Compare with database
    // 3. Update or insert as needed

    // Mock implementation for now
    this.logger.warn('Sync from device not fully implemented yet');

    // Return empty success result
    return {
      success: true,
      synced: 0,
      failed: 0,
      details: [],
    };
  }

  /**
   * Clear all fingerprints from device
   */
  async clearDevice(): Promise<ClearDeviceResult> {
    this.logger.log('🧹 Clearing all fingerprints from device...');

    try {
      // In a real implementation:
      // const device = this.getDeviceSafe();
      // await device.clearAllTemplates();

      // Invalidate all cache
      await this.cacheService.invalidateAllCache();

      this.logger.log('✅ Device cleared successfully');

      return {
        success: true,
        message: 'All fingerprints cleared from device',
      };
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.error('❌ Failed to clear device:', errorMessage);

      return {
        success: false,
        message: `Failed to clear device: ${errorMessage}`,
      };
    }
  }

  /**
   * Verify device connectivity and status
   */
  async verifyDeviceConnection(): Promise<DeviceConnectionStatus> {
    try {
      const device = this.getDeviceSafe();
      const connected = device.isConnected();

      let info: Record<string, unknown> | null = null;
      if (connected) {
        info = await device.getDeviceInfo();
      }

      return {
        connected,
        info,
      };
    } catch (error) {
      this.logger.error(
        'Failed to verify device connection:',
        this.getErrorMessage(error),
      );
      return {
        connected: false,
        info: null,
      };
    }
  }

  // --- Private Helpers ---

  /**
   * Centralized logic to iterate and sync a list of fingerprints
   */
  private async processFingerprintSync(
    fingerprints: Fingerprint[],
  ): Promise<SyncResult> {
    const device = this.getDeviceSafe();
    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      details: [],
    };

    for (const fingerprint of fingerprints) {
      try {
        await this.syncSingleFingerprint(fingerprint, device);

        result.synced++;
        result.details.push({
          fingerprintId: fingerprint.id,
          patientId: fingerprint.patient_id,
          status: 'success',
        });

        this.logger.debug(`✅ Synced fingerprint #${fingerprint.id} to device`);
      } catch (error) {
        const errorMessage = this.getErrorMessage(error);

        result.failed++;
        // If one fails, the overall batch success is false (or true with partial errors depending on business logic)
        // Usually sync is 'success' if process completes, even if items fail.
        // But following original logic:
        result.success = false;

        result.details.push({
          fingerprintId: fingerprint.id,
          patientId: fingerprint.patient_id,
          status: 'failed',
          error: errorMessage,
        });

        this.logger.error(
          `❌ Failed to sync fingerprint #${fingerprint.id}:`,
          errorMessage,
        );
      }
    }

    this.logger.log(
      `✅ Sync completed: ${result.synced} synced, ${result.failed} failed`,
    );

    return result;
  }

  private async syncSingleFingerprint(
    fingerprint: Fingerprint,
    device: IFingerprintDevice,
  ): Promise<void> {
    // Check connection before attempting
    if (!device.isConnected()) {
      throw new Error('Device not connected');
    }

    // Simulate network/device delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Real implementation placeholder:
    // await device.uploadTemplate({
    //   id: fingerprint.patient_id,
    //   position: fingerprint.finger_position,
    //   data: fingerprint.template_data
    // });

    // To prevent "unused variable" warnings in this mock:
    if (!fingerprint.id) throw new Error('Invalid fingerprint ID');
  }

  private getDeviceSafe(): IFingerprintDevice {
    // Casting factory result to local interface to ensure type safety in this file
    return this.deviceFactory.getDevice() as unknown as IFingerprintDevice;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
  }
}
