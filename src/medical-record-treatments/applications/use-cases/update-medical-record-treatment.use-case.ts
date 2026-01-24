// backend/src/medical-record-treatments/applications/use-cases/update-medical-record-treatment.use-case.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MedicalRecordTreatmentRepository } from '../../infrastructures/persistence/repositories/medical-record-treatment.repository';
import { TreatmentRepository } from '../../../treatments/infrastructures/persistence/repositories/treatment.repository';
import { MedicalRecordTreatmentValidatorService } from '../../domains/services/medical-record-treatment-validator.service';
import { MedicalRecordTreatmentMapper } from '../../domains/mappers/medical-record-treatment.mapper';
import { UpdateMedicalRecordTreatmentDto } from '../dto/update-medical-record-treatment.dto';
import { MedicalRecordTreatmentResponseDto } from '../dto/medical-record-treatment-response.dto';
import { MedicalRecordTreatmentUpdatedEvent } from '../../infrastructures/events/medical-record-treatment-updated.event';

@Injectable()
export class UpdateMedicalRecordTreatmentUseCase {
  constructor(
    private readonly repository: MedicalRecordTreatmentRepository,
    private readonly treatmentRepository: TreatmentRepository,
    private readonly validator: MedicalRecordTreatmentValidatorService,
    private readonly mapper: MedicalRecordTreatmentMapper,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    id: string,
    dto: UpdateMedicalRecordTreatmentDto,
  ): Promise<MedicalRecordTreatmentResponseDto> {
    const exists = await this.repository.findOne(id);
    if (!exists) {
      throw new NotFoundException(
        `Data perawatan rekam medis dengan ID ${id} tidak ditemukan`,
      );
    }

    // Validate treatment if provided
    if (dto.treatmentId) {
      const treatmentExists = await this.treatmentRepository.exists(
        dto.treatmentId,
      );
      if (!treatmentExists) {
        throw new NotFoundException(
          `Perawatan dengan ID ${dto.treatmentId} tidak ditemukan`,
        );
      }
    }

    // Validate data if provided
    if (
      dto.jumlah !== undefined ||
      dto.hargaSatuan !== undefined ||
      dto.diskon !== undefined
    ) {
      const jumlah = dto.jumlah ?? exists.jumlah;
      const hargaSatuan = dto.hargaSatuan ?? Number(exists.hargaSatuan);
      const diskon = dto.diskon ?? Number(exists.diskon);
      this.validator.validateTreatmentData(jumlah, hargaSatuan, diskon);
    }

    try {
      const result = await this.repository.update(id, dto);
      const response = this.mapper.toResponseDto(result);

      // Emit event
      this.eventEmitter.emit(
        'medical-record-treatment.updated',
        new MedicalRecordTreatmentUpdatedEvent(
          result.id,
          result.medicalRecordId,
          result.treatmentId,
          Number(result.total),
          result.updatedAt,
        ),
      );

      return response;
    } catch (error) {
      throw new BadRequestException('Gagal mengupdate perawatan rekam medis');
    }
  }
}
