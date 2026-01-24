import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PatientRepository } from '../../infrastructure/persistence/repositories/patients.repository';
import { PatientCacheService } from '../../infrastructure/cache/patient-cache.service';

@Injectable()
export class PatientRestoreService {
  private readonly logger = new Logger(PatientRestoreService.name);

  constructor(
    private readonly customPatientRepository: PatientRepository,
    private readonly cacheService: PatientCacheService,
  ) {}

  /**
   * Restore soft-deleted patient
   */
  async execute(id: string): Promise<{ message: string }> {
    try {
      const patient =
        await this.customPatientRepository.findSoftDeletedById(id);

      if (!patient) {
        throw new NotFoundException(
          `Pasien dengan ID #${id} tidak ditemukan atau tidak dihapus`,
        );
      }

      await this.customPatientRepository.restore(id);
      this.logger.log(`♻️ Patient restored: #${id} - ${patient.nama_lengkap}`);

      // Invalidate caches
      await this.cacheService.invalidatePatientCache(id);
      await this.cacheService.invalidateListCaches();

      return { message: `Pasien ${patient.nama_lengkap} berhasil dipulihkan` };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`❌ Error restoring patient ID ${id}:`, error);
      throw new BadRequestException('Gagal memulihkan pasien');
    }
  }
}
