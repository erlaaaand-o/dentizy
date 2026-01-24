import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Patient } from '../../domains/entities/patient.entity';
import { PatientMapper } from '../../domains/mappers/patient.mapper';
import { PatientValidator } from '../../domains/validators/patient.validator';
import { PatientCacheService } from '../../infrastructure/cache/patient-cache.service';
import { PatientCreatedEvent } from '../../infrastructure/events/patient-created.event';
import { MedicalRecordNumberGenerator } from '../../infrastructure/generator/medical-record-number.generator';
import { TransactionManager } from '../../infrastructure/transactions/transaction.manager';
import { CreatePatientDto } from '../dto/create-patient.dto';
import { PatientResponseDto } from '../dto/patient-response.dto';

@Injectable()
export class PatientCreationService {
  private readonly logger = new Logger(PatientCreationService.name);

  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    private readonly recordGenerator: MedicalRecordNumberGenerator,
    private readonly validator: PatientValidator,
    private readonly transactionManager: TransactionManager,
    private readonly cacheService: PatientCacheService,
    private readonly mapper: PatientMapper,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Buat pasien baru dengan transaction dan retry mechanism
   */
  async execute(
    createPatientDto: CreatePatientDto,
  ): Promise<PatientResponseDto> {
    const patient = await this.transactionManager.executeWithRetry(
      async (queryRunner) => {
        // Validasi business logic
        await this.validator.validateCreate(createPatientDto);

        // Generate nomor rekam medis
        const nomorRekamMedis = await this.recordGenerator.generate();

        // Buat dan simpan pasien
        const newPatient = queryRunner.manager.create(Patient, {
          ...createPatientDto,
          nomor_rekam_medis: nomorRekamMedis,
          tanggal_lahir: createPatientDto.tanggal_lahir
            ? new Date(createPatientDto.tanggal_lahir)
            : undefined,
          is_active: true,
        });

        const savedPatient = await queryRunner.manager.save(newPatient);
        this.logger.log(
          `✅ Patient created: ${savedPatient.nama_lengkap} (${savedPatient.nomor_rekam_medis})`,
        );

        return savedPatient;
      },
    );

    // Emit event untuk listener
    this.eventEmitter.emit('patient.created', new PatientCreatedEvent(patient));

    // Invalidate list caches
    await this.cacheService.invalidateListCaches();

    return this.mapper.toResponseDto(patient);
  }
}
