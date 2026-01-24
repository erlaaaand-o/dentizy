import { Injectable } from '@nestjs/common';
import { PatientRepository } from '../../infrastructure/persistence/repositories/patients.repository';
import { PatientCacheService } from '../../infrastructure/cache/patient-cache.service';

@Injectable()
export class PatientStatisticsService {
  constructor(
    private readonly customPatientRepository: PatientRepository,
    private readonly cacheService: PatientCacheService,
  ) {}

  /**
   * Get statistics untuk dashboard
   */
  async execute(): Promise<{
    total: number;
    new_this_month: number;
    active: number;
  }> {
    return this.cacheService.getCachedStats(async () => {
      return this.customPatientRepository.getStatistics();
    });
  }
}
