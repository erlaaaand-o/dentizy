// domains/validators/timing-attack.guard.ts
export class TimingAttackGuard {
  private static readonly MIN_RESPONSE_TIME_MS = 200;
  private static readonly MAX_JITTER_MS = 50;

  /**
   * Calculate delay to prevent timing attacks
   */
  static calculateDelay(startTime: number): number {
    const elapsed = Date.now() - startTime;
    const jitter = Math.random() * this.MAX_JITTER_MS;
    const minTime = this.MIN_RESPONSE_TIME_MS + jitter;

    return Math.max(0, minTime - elapsed);
  }

  /**
   * Execute with timing protection
   */
  static async executeWithTimingProtection<T>(
    operation: () => Promise<T>,
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await operation();
      await this.delay(this.calculateDelay(startTime));
      return result;
    } catch (error) {
      await this.delay(this.calculateDelay(startTime));
      throw error;
    }
  }

  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
