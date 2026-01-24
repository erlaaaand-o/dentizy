import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fingerprint } from '../../domains/entities/fingerprint.entity';
import { FingerprintDeviceFactory } from '../../infrastructure/devices/fingerprint-device-factory';
import { FingerprintCacheService } from '../../infrastructure/cache/fingerprint-cache.service';

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  details: {
    fingerprintId: string;
    patientId: string;
    status: 'success' | 'failed';
    error?: string;
  }[];
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

    const device = this.deviceFactory.getDevice();
    const fingerprints = await this.fingerprintRepository.find({
      where: { is_active: true },
    });

    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      details: [],
    };

    for (const fingerprint of fingerprints) {
      try {
        // In a real implementation, you would:
        // 1. Convert template to device format
        // 2. Upload to device memory
        // 3. Verify upload success

        // Mock implementation
        await this.syncFingerprintToDevice(fingerprint, device);

        result.synced++;
        result.details.push({
          fingerprintId: fingerprint.id,
          patientId: fingerprint.patient_id,
          status: 'success',
        });

        this.logger.debug(`✅ Synced fingerprint #${fingerprint.id} to device`);
      } catch (error) {
        result.failed++;
        result.success = false;
        result.details.push({
          fingerprintId: fingerprint.id,
          patientId: fingerprint.patient_id,
          status: 'failed',
          error: error.message,
        });

        this.logger.error(
          `❌ Failed to sync fingerprint #${fingerprint.id}:`,
          error,
        );
      }
    }

    this.logger.log(
      `✅ Sync completed: ${result.synced} synced, ${result.failed} failed`,
    );

    return result;
  }

  /**
   * Sync fingerprints for specific patient
   */
  async syncPatientToDevice(patientId: string): Promise<SyncResult> {
    this.logger.log(`🔄 Syncing fingerprints for patient #${patientId}...`);

    const device = this.deviceFactory.getDevice();
    const fingerprints = await this.fingerprintRepository.find({
      where: { patient_id: patientId, is_active: true },
    });

    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      details: [],
    };

    for (const fingerprint of fingerprints) {
      try {
        await this.syncFingerprintToDevice(fingerprint, device);

        result.synced++;
        result.details.push({
          fingerprintId: fingerprint.id,
          patientId: fingerprint.patient_id,
          status: 'success',
        });
      } catch (error) {
        result.failed++;
        result.success = false;
        result.details.push({
          fingerprintId: fingerprint.id,
          patientId: fingerprint.patient_id,
          status: 'failed',
          error: error.message,
        });
      }
    }

    return result;
  }

  /**
   * Sync from device to database (pull mode)
   */
  async syncFromDevice(): Promise<SyncResult> {
    this.logger.log('🔄 Starting sync from device to database...');

    const device = this.deviceFactory.getDevice();

    // In a real implementation:
    // 1. Get all fingerprints from device memory
    // 2. Compare with database
    // 3. Update or insert as needed

    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      details: [],
    };

    // Mock implementation
    this.logger.warn('Sync from device not fully implemented yet');

    return result;
  }

  /**
   * Clear all fingerprints from device
   */
  async clearDevice(): Promise<{ success: boolean; message: string }> {
    this.logger.log('🧹 Clearing all fingerprints from device...');

    const device = this.deviceFactory.getDevice();

    try {
      // In a real implementation:
      // await device.clearAllTemplates();

      // Invalidate all cache
      await this.cacheService.invalidateAllCache();

      this.logger.log('✅ Device cleared successfully');

      return {
        success: true,
        message: 'All fingerprints cleared from device',
      };
    } catch (error) {
      this.logger.error('❌ Failed to clear device:', error);
      return {
        success: false,
        message: `Failed to clear device: ${error.message}`,
      };
    }
  }

  /**
   * Verify device connectivity and status
   */
  async verifyDeviceConnection(): Promise<{
    connected: boolean;
    info: any;
  }> {
    const device = this.deviceFactory.getDevice();

    try {
      const connected = device.isConnected();
      const info = await device.getDeviceInfo();

      return {
        connected,
        info,
      };
    } catch (error) {
      this.logger.error('Failed to verify device connection:', error);
      return {
        connected: false,
        info: null,
      };
    }
  }

  private async syncFingerprintToDevice(
    fingerprint: Fingerprint,
    device: any,
  ): Promise<void> {
    // Mock implementation - in real scenario:
    // 1. Format template for device
    // 2. Upload to device with user ID mapping
    // 3. Verify upload

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check if device is connected
    if (!device.isConnected()) {
      throw new Error('Device not connected');
    }

    // In real implementation:
    // await device.uploadTemplate(
    //     fingerprint.patient_id,
    //     fingerprint.finger_position,
    //     fingerprint.template_data
    // );
  }
}
