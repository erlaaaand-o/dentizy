import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { IFingerprintDevice } from '../fingerprint-device.interface';

// --- Interfaces ---

// Interface placeholder untuk library eksternal (misal: zklib)
// Menggantikan penggunaan 'any' pada properti device
interface IZKLibDriver {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  // Tambahkan method lain sesuai API library aslinya nanti
  captureFingerprint?(): Promise<Buffer>;
}

// Interface untuk data informasi device
export interface ZKTecoDeviceInfo {
  id: string;
  model: string;
  version: string;
  status: 'connected' | 'disconnected';
  [key: string]: unknown; // Allow extra properties
}

@Injectable()
export class ZKTecoAdapter implements IFingerprintDevice {
  private readonly logger = new Logger(ZKTecoAdapter.name);
  private connected = false;

  // Menggunakan Union Type dengan Interface, bukan any
  private device: IZKLibDriver | null = null;

  constructor(private readonly configService: ConfigService) {}

  async connect(): Promise<boolean> {
    try {
      const ip = this.configService.get<string>('ZKTECO_DEVICE_IP');
      const port = this.configService.get<number>('ZKTECO_DEVICE_PORT', 4370);

      if (!ip) {
        this.logger.error(
          '❌ Configuration error: ZKTECO_DEVICE_IP is missing',
        );
        return false;
      }

      this.logger.log(`🔄 Connecting to ZKTeco device at ${ip}:${port}...`);

      // Initialize ZKTeco device (Mock implementation example)
      // Saat library sudah ada, ganti ini dengan: this.device = new ZKLib(...)

      // Mocking device object
      this.device = {
        connect: () => Promise.resolve(),
        disconnect: () => Promise.resolve(),
      };

      await this.device.connect();

      this.connected = true;
      this.logger.log(`✅ Connected to ZKTeco device at ${ip}:${port}`);
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `❌ Failed to connect to ZKTeco device: ${errorMessage}`,
      );
      this.connected = false;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.device && this.connected) {
      await this.device.disconnect();
      this.device = null;
    }

    this.connected = false;
    this.logger.log('Disconnected from ZKTeco device');
  }

  async capture(): Promise<string> {
    if (!this.connected) {
      throw new Error('Device not connected');
    }

    // Implement fingerprint capture logic
    // if (this.device?.captureFingerprint) {
    //   const template = await this.device.captureFingerprint();
    //   return template.toString('base64');
    // }

    // Mock implementation
    return Promise.resolve('ZKTECO_MOCK_TEMPLATE_DATA_BASE64');
  }

  async match(template1: string, template2: string): Promise<number> {
    // Implement matching logic
    // const score = await this.device.matchTemplates(template1, template2);
    // return score;

    // Mock implementation - simple strict comparison
    return Promise.resolve(template1 === template2 ? 100 : 0);
  }

  async getDeviceInfo(): Promise<ZKTecoDeviceInfo> {
    return Promise.resolve({
      id: 'ZKTECO-001',
      model: 'ZK4500',
      version: '1.0.0',
      status: this.connected ? 'connected' : 'disconnected',
    });
  }

  isConnected(): boolean {
    return this.connected;
  }
}
