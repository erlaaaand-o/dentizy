// backend/src/medical-record-treatments/applications/use-cases/find-one-medical-record-treatment.use-case.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { MedicalRecordTreatmentRepository } from '../../infrastructures/persistence/repositories/medical-record-treatment.repository';
import { MedicalRecordTreatmentMapper } from '../../domains/mappers/medical-record-treatment.mapper';
import { MedicalRecordTreatmentResponseDto } from '../dto/medical-record-treatment-response.dto';

@Injectable()
export class FindOneMedicalRecordTreatmentUseCase {
  constructor(
    private readonly repository: MedicalRecordTreatmentRepository,
    private readonly mapper: MedicalRecordTreatmentMapper,
  ) {}

  async execute(id: string): Promise<MedicalRecordTreatmentResponseDto> {
    const result = await this.repository.findOne(id);
    if (!result) {
      throw new NotFoundException(
        `Data perawatan rekam medis dengan ID ${id} tidak ditemukan`,
      );
    }
    return this.mapper.toResponseDto(result);
  }
}
