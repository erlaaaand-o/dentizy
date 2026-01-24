import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IFingerprintDevice } from '../fingerprint-device.interface';
// import ZKLib from 'zklib'; // Install: npm install zklib

@Injectable()
export class ZKTecoAdapter implements IFingerprintDevice {
  private readonly logger = new Logger(ZKTecoAdapter.name);
  private connected = false;
  private device: any; // ZKLib instance

  constructor(private readonly configService: ConfigService) {}

  async connect(): Promise<boolean> {
    try {
      const ip = this.configService.get<string>('ZKTECO_DEVICE_IP');
      const port = this.configService.get<number>('ZKTECO_DEVICE_PORT', 4370);

      // Initialize ZKTeco device
      // this.device = new ZKLib(ip, port, 5000, 5000);
      // await this.device.connect();

      this.connected = true;
      this.logger.log(`✅ Connected to ZKTeco device at ${ip}:${port}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to connect to ZKTeco device:`, error);
      this.connected = false;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.device && this.connected) {
      // await this.device.disconnect();
      this.connected = false;
      this.logger.log('Disconnected from ZKTeco device');
    }
  }

  async capture(): Promise<string> {
    if (!this.connected) {
      throw new Error('Device not connected');
    }

    // Implement fingerprint capture logic
    // const template = await this.device.captureFingerprint();
    // return Buffer.from(template).toString('base64');

    // Mock implementation
    return 'ZKTECO_MOCK_TEMPLATE_DATA_BASE64';
  }

  async match(template1: string, template2: string): Promise<number> {
    // Implement matching logic
    // const score = await this.device.matchTemplates(template1, template2);
    // return score;

    // Mock implementation - simple comparison
    return template1 === template2 ? 100 : 0;
  }

  async getDeviceInfo(): Promise<{
    id: string;
    model: string;
    version: string;
    status: string;
  }> {
    return {
      id: 'ZKTECO-001',
      model: 'ZK4500',
      version: '1.0.0',
      status: this.connected ? 'connected' : 'disconnected',
    };
  }

  isConnected(): boolean {
    return this.connected;
  }
}
