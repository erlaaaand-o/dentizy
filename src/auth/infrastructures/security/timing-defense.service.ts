// infrastructure/security/timing-defense.service.ts
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TimingDefenseService {
  private readonly logger = new Logger(TimingDefenseService.name);
  private readonly MIN_RESPONSE_TIME_MS = 200;
  private readonly MAX_JITTER_MS = 50;

  /**
   * Ensure minimum response time with jitter
   */
  async ensureMinimumResponseTime(startTime: number): Promise<void> {
    const elapsed = Date.now() - startTime;
    const jitter = Math.random() * this.MAX_JITTER_MS;
    const minTime = this.MIN_RESPONSE_TIME_MS + jitter;
    const delay = Math.max(0, minTime - elapsed);

    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  /**
   * Execute operation with timing protection
   */
  async executeWithProtection<T>(operation: () => Promise<T>): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await operation();
      await this.ensureMinimumResponseTime(startTime);
      return result;
    } catch (error) {
      await this.ensureMinimumResponseTime(startTime);
      throw error;
    }
  }

  /**
   * Add random delay for additional obfuscation
   */
  async addRandomDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = minMs + Math.random() * (maxMs - minMs);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}
