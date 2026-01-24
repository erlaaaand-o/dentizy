// backend/src/medical-record-treatments/applications/use-cases/find-by-medical-record-id.use-case.ts
import { Injectable } from '@nestjs/common';
import { MedicalRecordTreatmentRepository } from '../../infrastructures/persistence/repositories/medical-record-treatment.repository';
import { MedicalRecordTreatmentMapper } from '../../domains/mappers/medical-record-treatment.mapper';
import { MedicalRecordTreatmentResponseDto } from '../dto/medical-record-treatment-response.dto';

@Injectable()
export class FindByMedicalRecordIdUseCase {
  constructor(
    private readonly repository: MedicalRecordTreatmentRepository,
    private readonly mapper: MedicalRecordTreatmentMapper,
  ) {}

  async execute(
    medicalRecordId: string,
  ): Promise<MedicalRecordTreatmentResponseDto[]> {
    const results =
      await this.repository.findByMedicalRecordId(medicalRecordId);
    return this.mapper.toResponseDtoList(results);
  }
}
