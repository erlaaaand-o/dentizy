import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fingerprint } from '../../domains/entities/fingerprint.entity';
import { FingerprintCacheService } from '../../infrastructure/cache/fingerprint-cache.service';

@Injectable()
export class FingerprintDeletionService {
  private readonly logger = new Logger(FingerprintDeletionService.name);

  constructor(
    @InjectRepository(Fingerprint)
    private readonly fingerprintRepository: Repository<Fingerprint>,
    private readonly cacheService: FingerprintCacheService,
  ) {}

  async execute(id: string): Promise<{ message: string }> {
    // Find fingerprint
    const fingerprint = await this.fingerprintRepository.findOne({
      where: { id },
    });

    if (!fingerprint) {
      throw new NotFoundException(
        `Sidik jari dengan ID #${id} tidak ditemukan`,
      );
    }

    // Soft delete by setting is_active to false
    fingerprint.is_active = false;
    await this.fingerprintRepository.save(fingerprint);

    // Or hard delete (uncomment if needed)
    // await this.fingerprintRepository.remove(fingerprint);

    this.logger.log(
      `🗑️ Fingerprint deleted: ID #${id} (Patient #${fingerprint.patient_id})`,
    );

    // Invalidate cache
    await this.cacheService.invalidatePatientCache(fingerprint.patient_id);

    return {
      message: `Sidik jari berhasil dihapus`,
    };
  }

  async deleteByPatient(patientId: string): Promise<{ deleted: number }> {
    const result = await this.fingerprintRepository.update(
      { patient_id: patientId, is_active: true },
      { is_active: false },
    );

    this.logger.log(
      `🗑️ Deleted ${result.affected} fingerprints for patient #${patientId}`,
    );

    // Invalidate cache
    await this.cacheService.invalidatePatientCache(patientId);

    return { deleted: result.affected || 0 };
  }

  async deleteByFingerPosition(
    patientId: string,
    fingerPosition: string,
  ): Promise<{ message: string }> {
    const fingerprint = await this.fingerprintRepository.findOne({
      where: {
        patient_id: patientId,
        finger_position: fingerPosition as any,
        is_active: true,
      },
    });

    if (!fingerprint) {
      throw new NotFoundException(
        `Sidik jari ${fingerPosition} untuk pasien #${patientId} tidak ditemukan`,
      );
    }

    fingerprint.is_active = false;
    await this.fingerprintRepository.save(fingerprint);

    this.logger.log(
      `🗑️ Fingerprint deleted: Patient #${patientId} - ${fingerPosition}`,
    );

    // Invalidate cache
    await this.cacheService.invalidatePatientCache(patientId);

    return {
      message: `Sidik jari ${fingerPosition} berhasil dihapus`,
    };
  }
}
