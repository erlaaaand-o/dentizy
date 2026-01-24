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
import { UpdatePatientDto } from '../dto/update-patient.dto';
import { PatientResponseDto } from '../dto/patient-response.dto';
import { PatientValidator } from '../../domains/validators/patient.validator';
import { PatientCacheService } from '../../infrastructure/cache/patient-cache.service';
import { PatientMapper } from '../../domains/mappers/patient.mapper';
import { PatientUpdatedEvent } from '../../infrastructure/events/patient-updated.event';

@Injectable()
export class PatientUpdateService {
  private readonly logger = new Logger(PatientUpdateService.name);

  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    private readonly validator: PatientValidator,
    private readonly cacheService: PatientCacheService,
    private readonly mapper: PatientMapper,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Update patient data
   */
  async execute(
    id: string,
    updatePatientDto: UpdatePatientDto,
  ): Promise<PatientResponseDto> {
    try {
      const patient = await this.patientRepository.findOneBy({ id });

      if (!patient) {
        throw new NotFoundException(`Pasien dengan ID #${id} tidak ditemukan`);
      }

      // Validasi update
      await this.validator.validateUpdate(id, updatePatientDto);

      // Update data
      Object.assign(patient, updatePatientDto);

      if (updatePatientDto.tanggal_lahir) {
        patient.tanggal_lahir = new Date(updatePatientDto.tanggal_lahir);
      }

      const updatedPatient = await this.patientRepository.save(patient);
      this.logger.log(
        `✅ Patient updated: #${id} - ${updatedPatient.nama_lengkap}`,
      );

      // Emit event
      this.eventEmitter.emit(
        'patient.updated',
        new PatientUpdatedEvent(id, updatePatientDto),
      );

      // Invalidate caches
      await this.cacheService.invalidatePatientCache(id);
      await this.cacheService.invalidateListCaches();

      return this.mapper.toResponseDto(updatedPatient);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`❌ Error updating patient ID ${id}:`, error);
      throw new BadRequestException('Gagal mengupdate data pasien');
    }
  }
}
