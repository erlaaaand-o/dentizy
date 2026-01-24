import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Patient } from '../../domains/entities/patient.entity';
import { PatientRepository } from '../../infrastructure/persistence/repositories/patients.repository';
import { PatientCacheService } from '../../infrastructure/cache/patient-cache.service';
import { PatientDeletedEvent } from '../../infrastructure/events/patient-deleted.event';

@Injectable()
export class PatientDeletionService {
  private readonly logger = new Logger(PatientDeletionService.name);

  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    private readonly customPatientRepository: PatientRepository,
    private readonly cacheService: PatientCacheService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Soft delete patient
   */
  async execute(id: string): Promise<{ message: string }> {
    try {
      const patient = await this.patientRepository.findOne({
        where: { id },
        relations: ['appointments'],
      });

      if (!patient) {
        throw new NotFoundException(`Pasien dengan ID #${id} tidak ditemukan`);
      }

      // Check for active appointments
      const hasActiveAppointments = patient.appointments?.some((app) =>
        ['dijadwalkan', 'sedang_berlangsung'].includes(app.status),
      );

      if (hasActiveAppointments) {
        throw new ConflictException(
          'Tidak bisa menghapus pasien yang memiliki janji temu aktif',
        );
      }

      const patientName = patient.nama_lengkap;

      // Soft delete
      await this.customPatientRepository.softDelete(id);
      this.logger.log(`🗑️ Patient soft deleted: #${id} - ${patientName}`);

      // Emit event
      this.eventEmitter.emit(
        'patient.deleted',
        new PatientDeletedEvent(id, patientName),
      );

      // Invalidate caches
      await this.cacheService.invalidatePatientCache(id);
      await this.cacheService.invalidateListCaches();

      return { message: `Pasien ${patientName} berhasil dihapus` };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(`❌ Error deleting patient ID ${id}:`, error);
      throw new BadRequestException('Gagal menghapus pasien');
    }
  }
}
