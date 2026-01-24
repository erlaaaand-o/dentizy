import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PatientResponseDto } from '../../application/dto/patient-response.dto';
import { SearchPatientDto } from '../../application/dto/search-patient.dto';

interface CacheStore {
  clear: () => Promise<void>;
}

@Injectable()
export class PatientCacheService {
  private readonly logger = new Logger(PatientCacheService.name);
  private readonly CACHE_TTL_SECONDS = 300; // 5 menit
  private readonly CACHE_PREFIX = 'patient:';

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Helper untuk membuat cache key yang konsisten
   */
  private getCacheKey(operation: string, params: unknown): string {
    const paramsStr = JSON.stringify(params);
    return `${this.CACHE_PREFIX}${operation}:${paramsStr}`;
  }

  /**
   * Membungkus pengambilan data list/search dengan caching.
   */
  async getCachedListOrSearch<T>(
    query: SearchPatientDto,
    fallback: () => Promise<T>,
  ): Promise<T> {
    const operation = query.search ? 'search' : 'list';
    const cacheKey = this.getCacheKey(operation, query);

    try {
      const cached = await this.cacheManager.get<T>(cacheKey);
      if (cached) {
        this.logger.debug(`📦 Cache hit: ${cacheKey}`);
        return cached;
      }

      this.logger.debug(`📦 Cache miss: ${cacheKey}`);
      const result = await fallback();

      const ttl = operation === 'search' ? 60 : this.CACHE_TTL_SECONDS;
      await this.cacheManager.set(cacheKey, result, ttl * 1000);

      return result;
    } catch (error) {
      this.logger.error(
        `Error in cache operation: ${error instanceof Error ? error.message : String(error)}`,
      );
      return fallback();
    }
  }

  /**
   * Membungkus pengambilan data findOne dengan caching.
   */
  async getCachedPatient(
    id: string,
    fallback: () => Promise<PatientResponseDto>,
  ): Promise<PatientResponseDto> {
    const cacheKey = this.getCacheKey('detail', { id });

    try {
      const cached = await this.cacheManager.get<PatientResponseDto>(cacheKey);
      if (cached) {
        this.logger.debug(`📦 Cache hit: ${cacheKey}`);
        return cached;
      }

      this.logger.debug(`📦 Cache miss: ${cacheKey}`);
      const result = await fallback();
      await this.cacheManager.set(
        cacheKey,
        result,
        this.CACHE_TTL_SECONDS * 1000,
      );

      return result;
    } catch (error) {
      this.logger.error(`Error in cache operation: ${error.message}`);
      return fallback();
    }
  }

  /**
   * Membungkus pengambilan data statistik dengan caching.
   */
  async getCachedStats<T>(fallback: () => Promise<T>): Promise<T> {
    const cacheKey = this.getCacheKey('stats', {});

    try {
      const cached = await this.cacheManager.get<T>(cacheKey);

      if (cached) {
        this.logger.debug(`📦 Cache hit: ${cacheKey}`);
        return cached;
      }

      this.logger.debug(`📦 Cache miss: ${cacheKey}`);
      const stats = await fallback();
      await this.cacheManager.set(cacheKey, stats, 60 * 1000); // Cache stats 1 menit
      return stats;
    } catch (error) {
      this.logger.error(`Error in cache operation: ${error.message}`);
      return fallback();
    }
  }

  /**
   * Meng-invalidate cache untuk satu pasien (by ID).
   */
  async invalidatePatientCache(id: string): Promise<void> {
    try {
      const cacheKey = this.getCacheKey('detail', { id });
      await this.cacheManager.del(cacheKey);
      this.logger.log(`💨 Invalidated cache: ${cacheKey}`);
    } catch (error) {
      this.logger.error(`Error invalidating cache: ${error.message}`);
    }
  }

  /**
   * Meng-invalidate semua cache yang terkait dengan list, search, dan stats.
   */
  async invalidateListCaches(): Promise<void> {
    try {
      this.logger.warn(
        `💨 Invalidating all list/search/stats caches. (Using 'reset' for memory store)`,
      );
      const store = (this.cacheManager as unknown as { stores: CacheStore[] })
        .stores[0];
      await store.clear();
      this.logger.log(`💨 All cache cleared.`);
    } catch (error) {
      this.logger.error(
        `Error invalidating list caches: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get cache store untuk monitoring (optional)
   */
  async getCacheStore(): Promise<Cache> {
    return this.cacheManager;
  }
}
