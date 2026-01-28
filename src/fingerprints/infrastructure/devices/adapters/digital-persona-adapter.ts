import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { IFingerprintDevice } from '../fingerprint-device.interface';

// --- Interfaces ---

// Interface placeholder untuk SDK Digital Persona (menggantikan 'any')
interface IDigitalPersonaDriver {
  initialize(options: { timeout: number }): Promise<void>;
  disconnect(): Promise<void>;
  captureSample?(): Promise<unknown>; // Ganti unknown dengan tipe spesifik jika SDK sudah ada
  createTemplate?(sample: unknown): Promise<Buffer>;
  compare?(fmd1: Buffer, fmd2: Buffer): Promise<{ score: number }>;
}

export interface DPDeviceInfo {
  id: string;
  model: string;
  version: string;
  status: 'connected' | 'disconnected';
  [key: string]: unknown;
}

export interface DPCapabilities {
  resolution: number;
  imageSize: { width: number; height: number };
  supportedFormats: string[];
}

export interface DPVerificationResult {
  matched: boolean;
  score: number;
  far: number;
}

@Injectable()
export class DigitalPersonaAdapter implements IFingerprintDevice {
  private readonly logger = new Logger(DigitalPersonaAdapter.name);
  private connected = false;

  // Menggunakan interface driver, bukan any
  private device: IDigitalPersonaDriver | null = null;

  constructor(private readonly configService: ConfigService) {}

  async connect(): Promise<boolean> {
    try {
      const deviceId = this.configService.get<string>(
        'DIGITAL_PERSONA_DEVICE_ID',
        'DP-001',
      );
      // Timeout ini disiapkan untuk config SDK
      const timeout = this.configService.get<number>('DP_TIMEOUT', 5000);

      // Initialize Digital Persona device (Mock Implementation)

      // Saat implementasi nyata:
      // this.device = new DPDevice(deviceId);
      // await this.device.initialize({ timeout });

      // Mock setup
      this.device = {
        initialize: () => Promise.resolve(),
        disconnect: () => Promise.resolve(),
      };

      // Simulasi penggunaan variabel timeout agar tidak dianggap unused oleh linter
      await this.device.initialize({ timeout });

      this.connected = true;
      this.logger.log(`✅ Connected to Digital Persona device: ${deviceId}`);
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `❌ Failed to connect to Digital Persona device: ${errorMessage}`,
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
    this.logger.log('Disconnected from Digital Persona device');
  }

  async capture(): Promise<string> {
    if (!this.connected) {
      throw new Error('Device not connected');
    }

    try {
      // Implement Digital Persona capture logic
      // if (this.device?.captureSample && this.device?.createTemplate) {
      //   const sample = await this.device.captureSample();
      //   const template = await this.device.createTemplate(sample);
      //   return template.toString('base64');
      // }

      // Mock implementation
      this.logger.debug('Capturing fingerprint from Digital Persona device...');
      return Promise.resolve(this.generateMockTemplate('DP'));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to capture fingerprint: ${errorMessage}`);
      throw error;
    }
  }

  async match(template1: string, template2: string): Promise<number> {
    try {
      // Implement Digital Persona matching logic
      // if (this.device?.compare) {
      //   const fmd1 = Buffer.from(template1, 'base64');
      //   const fmd2 = Buffer.from(template2, 'base64');
      //   const result = await this.device.compare(fmd1, fmd2);
      //   return result.score;
      // }

      // Mock implementation
      if (template1 === template2) {
        return 100;
      }

      // Simulate FAR (False Acceptance Rate) based matching
      const similarity = this.calculateMatchScore(template1, template2);
      return Promise.resolve(similarity);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to match fingerprints: ${errorMessage}`);
      return 0;
    }
  }

  async getDeviceInfo(): Promise<DPDeviceInfo> {
    return Promise.resolve({
      id: this.configService.get<string>('DIGITAL_PERSONA_DEVICE_ID', 'DP-001'),
      model: 'U.are.U 4500',
      version: '3.2.1',
      status: this.connected ? 'connected' : 'disconnected',
    });
  }

  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Digital Persona specific: Get device capabilities
   */
  async getCapabilities(): Promise<DPCapabilities> {
    return Promise.resolve({
      resolution: 500, // DPI
      imageSize: {
        width: 320,
        height: 355,
      },
      supportedFormats: ['ANSI_381', 'ISO_19794_2'],
    });
  }

  /**
   * Digital Persona specific: Verify with FAR threshold
   */
  async verifyWithFAR(
    template1: string,
    template2: string,
    farThreshold = 0.01,
  ): Promise<DPVerificationResult> {
    const score = await this.match(template1, template2);
    const far = this.scoreToFAR(score);

    return {
      matched: far <= farThreshold,
      score,
      far,
    };
  }

  // --- Private Helpers ---

  private generateMockTemplate(prefix: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const data = `${prefix}_TEMPLATE_${timestamp}_${random}`;
    return Buffer.from(data).toString('base64');
  }

  private calculateMatchScore(template1: string, template2: string): number {
    // Simulate a sophisticated matching algorithm (Mock logic)
    const minLength = Math.min(template1.length, template2.length);
    let matches = 0;

    for (let i = 0; i < minLength; i++) {
      if (template1[i] === template2[i]) {
        matches++;
      }
    }

    // Safe division check not strictly needed as string length >= 0, but good practice
    if (minLength === 0) return 0;

    const similarity = (matches / minLength) * 100;

    // Add some randomness to simulate real-world variations
    const noise = (Math.random() - 0.5) * 10;
    return Math.max(0, Math.min(100, similarity + noise));
  }

  private scoreToFAR(score: number): number {
    // Convert match score to False Acceptance Rate
    // Higher score = lower FAR
    // Example formula: 10^(-score/10)
    return Math.pow(10, -(score / 10));
  }
}
