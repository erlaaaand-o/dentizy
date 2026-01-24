// backend/src/medical-record-treatments/applications/use-cases/create-medical-record-treatment.use-case.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MedicalRecordTreatmentRepository } from '../../infrastructures/persistence/repositories/medical-record-treatment.repository';
import { TreatmentRepository } from '../../../treatments/infrastructures/persistence/repositories/treatment.repository';
import { MedicalRecordTreatmentCalculatorService } from '../../domains/services/medical-record-treatment-calculator.service';
import { MedicalRecordTreatmentValidatorService } from '../../domains/services/medical-record-treatment-validator.service';
import { MedicalRecordTreatmentMapper } from '../../domains/mappers/medical-record-treatment.mapper';
import { CreateMedicalRecordTreatmentDto } from '../dto/create-medical-record-treatment.dto';
import { MedicalRecordTreatmentResponseDto } from '../dto/medical-record-treatment-response.dto';
import { MedicalRecordTreatmentCreatedEvent } from '../../infrastructures/events/medical-record-treatment-created.event';

@Injectable()
export class CreateMedicalRecordTreatmentUseCase {
  constructor(
    private readonly repository: MedicalRecordTreatmentRepository,
    private readonly treatmentRepository: TreatmentRepository,
    private readonly calculator: MedicalRecordTreatmentCalculatorService,
    private readonly validator: MedicalRecordTreatmentValidatorService,
    private readonly mapper: MedicalRecordTreatmentMapper,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    dto: CreateMedicalRecordTreatmentDto,
  ): Promise<MedicalRecordTreatmentResponseDto> {
    // Validate treatment exists
    const treatmentExists = await this.treatmentRepository.exists(
      dto.treatmentId,
    );
    if (!treatmentExists) {
      throw new NotFoundException(
        `Perawatan dengan ID ${dto.treatmentId} tidak ditemukan`,
      );
    }

    // Validate data
    this.validator.validateTreatmentData(
      dto.jumlah,
      dto.hargaSatuan,
      dto.diskon || 0,
    );

    try {
      const result = await this.repository.create(dto);
      const response = this.mapper.toResponseDto(result);

      // Emit event
      this.eventEmitter.emit(
        'medical-record-treatment.created',
        new MedicalRecordTreatmentCreatedEvent(
          result.id,
          result.medicalRecordId,
          result.treatmentId,
          Number(result.total),
          result.createdAt,
        ),
      );

      return response;
    } catch (error) {
      throw new BadRequestException(
        'Gagal menambahkan perawatan ke rekam medis',
      );
    }
  }
}
