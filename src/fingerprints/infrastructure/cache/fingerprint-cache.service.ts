import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fingerprint } from '../../domains/entities/fingerprint.entity';
import type { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class FingerprintCacheService {
  private readonly logger = new Logger(FingerprintCacheService.name);
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly CACHE_PREFIX = 'fingerprint';

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(Fingerprint)
    private readonly fingerprintRepository: Repository<Fingerprint>,
  ) {}

  /**
   * Get patient fingerprints from cache or database
   */
  async getPatientFingerprints(patientId: string): Promise<Fingerprint[]> {
    const cacheKey = this.getCacheKey('patient', patientId);

    try {
      // Try to get from cache
      const cached = await this.cacheManager.get<Fingerprint[]>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for patient #${patientId}`);
        return cached;
      }

      // Get from database
      const fingerprints = await this.fingerprintRepository.find({
        where: { patient_id: patientId, is_active: true },
      });

      // Store in cache
      await this.cacheManager.set(cacheKey, fingerprints, this.CACHE_TTL);
      this.logger.debug(`Cached fingerprints for patient #${patientId}`);

      return fingerprints;
    } catch (error) {
      this.logger.error(`Cache error for patient #${patientId}:`, error);
      // Fallback to database
      return this.fingerprintRepository.find({
        where: { patient_id: patientId, is_active: true },
      });
    }
  }

  /**
   * Get all active fingerprints for 1:N verification
   */
  async getAllActiveFingerprints(): Promise<Fingerprint[]> {
    const cacheKey = this.getCacheKey('all', 'active');

    try {
      const cached = await this.cacheManager.get<Fingerprint[]>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for all active fingerprints`);
        return cached;
      }

      const fingerprints = await this.fingerprintRepository.find({
        where: { is_active: true },
        relations: ['patient'],
      });

      // Cache for shorter time due to larger dataset
      await this.cacheManager.set(cacheKey, fingerprints, 1800); // 30 minutes
      this.logger.debug(`Cached ${fingerprints.length} active fingerprints`);

      return fingerprints;
    } catch (error) {
      this.logger.error(`Cache error for all fingerprints:`, error);
      return this.fingerprintRepository.find({
        where: { is_active: true },
        relations: ['patient'],
      });
    }
  }

  /**
   * Cache verification result
   */
  async cacheVerification(fingerprintId: string, score: number): Promise<void> {
    const cacheKey = this.getCacheKey('verification', fingerprintId);
    try {
      await this.cacheManager.set(
        cacheKey,
        { fingerprintId, score, timestamp: new Date() },
        300, // 5 minutes
      );
    } catch (error) {
      this.logger.error(`Failed to cache verification:`, error);
    }
  }

  /**
   * Invalidate patient cache
   */
  async invalidatePatientCache(patientId: string): Promise<void> {
    const cacheKey = this.getCacheKey('patient', patientId);
    try {
      await this.cacheManager.del(cacheKey);
      // Also invalidate all active fingerprints cache
      await this.cacheManager.del(this.getCacheKey('all', 'active'));
      this.logger.debug(`Invalidated cache for patient #${patientId}`);
    } catch (error) {
      this.logger.error(`Failed to invalidate cache:`, error);
    }
  }

  /**
   * Invalidate all fingerprint cache
   */
  async invalidateAllCache(): Promise<void> {
    try {
      await this.cacheManager.clear();
      this.logger.log(`All fingerprint cache invalidated`);
    } catch (error) {
      this.logger.error(`Failed to invalidate all cache:`, error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    keys: number;
    hits: number;
    misses: number;
  }> {
    // This is a simplified version - implement based on your cache provider
    return {
      keys: 0,
      hits: 0,
      misses: 0,
    };
  }

  private getCacheKey(type: string, id: number | string): string {
    return `${this.CACHE_PREFIX}:${type}:${id}`;
  }
}
