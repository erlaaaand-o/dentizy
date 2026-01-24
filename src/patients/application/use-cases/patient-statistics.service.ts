import { Injectable } from '@nestjs/common';

import { PatientCacheService } from '../../infrastructure/cache/patient-cache.service';
import { PatientRepository } from '../../infrastructure/persistence/repositories/patients.repository';

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
