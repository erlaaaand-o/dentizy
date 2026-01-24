import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IFingerprintDevice } from '../fingerprint-device.interface';

@Injectable()
export class DigitalPersonaAdapter implements IFingerprintDevice {
  private readonly logger = new Logger(DigitalPersonaAdapter.name);
  private connected = false;
  private device: any;

  constructor(private readonly configService: ConfigService) {}

  async connect(): Promise<boolean> {
    try {
      const deviceId = this.configService.get<string>(
        'DIGITAL_PERSONA_DEVICE_ID',
        'DP-001',
      );
      const timeout = this.configService.get<number>('DP_TIMEOUT', 5000);

      // Initialize Digital Persona device
      // Implementation would depend on Digital Persona SDK
      // Example: this.device = new DPDevice(deviceId);
      // await this.device.initialize({ timeout });

      this.connected = true;
      this.logger.log(`✅ Connected to Digital Persona device: ${deviceId}`);
      return true;
    } catch (error) {
      this.logger.error(
        `❌ Failed to connect to Digital Persona device:`,
        error,
      );
      this.connected = false;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.device && this.connected) {
      // await this.device.disconnect();
      this.connected = false;
      this.logger.log('Disconnected from Digital Persona device');
    }
  }

  async capture(): Promise<string> {
    if (!this.connected) {
      throw new Error('Device not connected');
    }

    try {
      // Implement Digital Persona capture logic
      // const sample = await this.device.captureSample();
      // const template = await this.device.createTemplate(sample);
      // return Buffer.from(template).toString('base64');

      // Mock implementation
      this.logger.debug('Capturing fingerprint from Digital Persona device...');
      return this.generateMockTemplate('DP');
    } catch (error) {
      this.logger.error('Failed to capture fingerprint:', error);
      throw error;
    }
  }

  async match(template1: string, template2: string): Promise<number> {
    try {
      // Implement Digital Persona matching logic
      // const fmd1 = Buffer.from(template1, 'base64');
      // const fmd2 = Buffer.from(template2, 'base64');
      // const result = await this.device.compare(fmd1, fmd2);
      // return result.score;

      // Mock implementation
      if (template1 === template2) {
        return 100;
      }

      // Simulate FAR (False Acceptance Rate) based matching
      const similarity = this.calculateMatchScore(template1, template2);
      return similarity;
    } catch (error) {
      this.logger.error('Failed to match fingerprints:', error);
      return 0;
    }
  }

  async getDeviceInfo(): Promise<{
    id: string;
    model: string;
    version: string;
    status: string;
  }> {
    return {
      id: this.configService.get<string>('DIGITAL_PERSONA_DEVICE_ID', 'DP-001'),
      model: 'U.are.U 4500',
      version: '3.2.1',
      status: this.connected ? 'connected' : 'disconnected',
    };
  }

  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Digital Persona specific: Get device capabilities
   */
  async getCapabilities(): Promise<{
    resolution: number;
    imageSize: { width: number; height: number };
    supportedFormats: string[];
  }> {
    return {
      resolution: 500, // DPI
      imageSize: {
        width: 320,
        height: 355,
      },
      supportedFormats: ['ANSI_381', 'ISO_19794_2'],
    };
  }

  /**
   * Digital Persona specific: Verify with FAR threshold
   */
  async verifyWithFAR(
    template1: string,
    template2: string,
    farThreshold: number = 0.01,
  ): Promise<{ matched: boolean; score: number; far: number }> {
    const score = await this.match(template1, template2);
    const far = this.scoreToFAR(score);

    return {
      matched: far <= farThreshold,
      score,
      far,
    };
  }

  private generateMockTemplate(prefix: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const data = `${prefix}_TEMPLATE_${timestamp}_${random}`;
    return Buffer.from(data).toString('base64');
  }

  private calculateMatchScore(template1: string, template2: string): number {
    // Simulate a sophisticated matching algorithm
    const minLength = Math.min(template1.length, template2.length);
    let matches = 0;

    for (let i = 0; i < minLength; i++) {
      if (template1[i] === template2[i]) {
        matches++;
      }
    }

    const similarity = (matches / minLength) * 100;

    // Add some randomness to simulate real-world variations
    const noise = (Math.random() - 0.5) * 10;
    return Math.max(0, Math.min(100, similarity + noise));
  }

  private scoreToFAR(score: number): number {
    // Convert match score to False Acceptance Rate
    // Higher score = lower FAR
    return Math.pow(10, -(score / 10));
  }
}
