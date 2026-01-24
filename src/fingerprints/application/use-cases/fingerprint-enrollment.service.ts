import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Patient } from '../../../patients/domains/entities/patient.entity';
import { Fingerprint } from '../../domains/entities/fingerprint.entity';
import { FingerprintMapper } from '../../domains/mappers/fingerprint.mapper';
import { FingerprintValidator } from '../../domains/validators/fingerprint.validator';
import { FingerprintEnrolledEvent } from '../../infrastructure/events/fingerprint-enrolled.event';
import { CreateFingerprintDto } from '../dto/create-fingerprint.dto';
import { FingerprintResponseDto } from '../dto/fingerprint-response.dto';

@Injectable()
export class FingerprintEnrollmentService {
  private readonly logger = new Logger(FingerprintEnrollmentService.name);

  constructor(
    @InjectRepository(Fingerprint)
    private readonly fingerprintRepository: Repository<Fingerprint>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    private readonly validator: FingerprintValidator,
    private readonly mapper: FingerprintMapper,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: CreateFingerprintDto): Promise<FingerprintResponseDto> {
    // Validate
    await this.validator.validateEnrollment(dto);

    // Check if patient exists
    const patient = await this.patientRepository.findOneBy({
      id: dto.patient_id,
    });

    if (!patient) {
      throw new NotFoundException(
        `Pasien dengan ID #${dto.patient_id} tidak ditemukan`,
      );
    }

    // Check if finger already enrolled
    const existing = await this.fingerprintRepository.findOne({
      where: {
        patient_id: dto.patient_id,
        finger_position: dto.finger_position,
        is_active: true,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Sidik jari ${dto.finger_position} untuk pasien ini sudah terdaftar`,
      );
    }

    // Create fingerprint record
    const fingerprint = this.fingerprintRepository.create({
      ...dto,
      verification_count: 0,
      is_active: true,
    });

    const saved = await this.fingerprintRepository.save(fingerprint);

    this.logger.log(
      `✅ Fingerprint enrolled: Patient #${dto.patient_id} - ${dto.finger_position}`,
    );

    // Emit event
    this.eventEmitter.emit(
      'fingerprint.enrolled',
      new FingerprintEnrolledEvent(saved, patient),
    );

    return this.mapper.toResponseDto(saved);
  }
}
