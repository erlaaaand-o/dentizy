import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IFingerprintDevice } from '../fingerprint-device.interface';

@Injectable()
export class MorphoAdapter implements IFingerprintDevice {
  private readonly logger = new Logger(MorphoAdapter.name);
  private connected = false;
  private device: any;

  constructor(private readonly configService: ConfigService) {}

  async connect(): Promise<boolean> {
    try {
      const port = this.configService.get<string>('MORPHO_DEVICE_PORT', 'COM3');
      const timeout = this.configService.get<number>('MORPHO_TIMEOUT', 5000);

      // Initialize Morpho device
      // Implementation would depend on Morpho SDK
      // Example: this.device = new MorphoDevice(port, timeout);
      // await this.device.initialize();

      this.connected = true;
      this.logger.log(`✅ Connected to Morpho device on ${port}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to connect to Morpho device:`, error);
      this.connected = false;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.device && this.connected) {
      // await this.device.close();
      this.connected = false;
      this.logger.log('Disconnected from Morpho device');
    }
  }

  async capture(): Promise<string> {
    if (!this.connected) {
      throw new Error('Device not connected');
    }

    try {
      // Implement Morpho capture logic
      // const result = await this.device.capture();
      // const template = result.template;
      // return Buffer.from(template).toString('base64');

      // Mock implementation
      this.logger.debug('Capturing fingerprint from Morpho device...');
      return this.generateMockTemplate('MORPHO');
    } catch (error) {
      this.logger.error('Failed to capture fingerprint:', error);
      throw error;
    }
  }

  async match(template1: string, template2: string): Promise<number> {
    try {
      // Implement Morpho matching logic
      // const score = await this.device.match(
      //     Buffer.from(template1, 'base64'),
      //     Buffer.from(template2, 'base64')
      // );
      // return score;

      // Mock implementation with similarity check
      if (template1 === template2) {
        return 100;
      }

      // Simulate matching algorithm
      const similarity = this.calculateSimilarity(template1, template2);
      return Math.round(similarity);
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
      id: this.configService.get<string>('MORPHO_DEVICE_ID', 'MORPHO-001'),
      model: 'MSO 1300 E3',
      version: '2.1.0',
      status: this.connected ? 'connected' : 'disconnected',
    };
  }

  isConnected(): boolean {
    return this.connected;
  }

  private generateMockTemplate(prefix: string): string {
    const randomData = Buffer.from(
      `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    );
    return randomData.toString('base64');
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Simple Levenshtein distance-based similarity
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
      return 100;
    }

    const editDistance = this.levenshteinDistance(str1, str2);
    return ((longer.length - editDistance) / longer.length) * 100;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}
