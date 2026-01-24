// backend/src/medical-record-treatments/applications/use-cases/get-total-by-medical-record-id.use-case.ts
import { Injectable } from '@nestjs/common';
import { MedicalRecordTreatmentRepository } from '../../infrastructures/persistence/repositories/medical-record-treatment.repository';

@Injectable()
export class GetTotalByMedicalRecordIdUseCase {
  constructor(private readonly repository: MedicalRecordTreatmentRepository) {}

  async execute(medicalRecordId: string): Promise<number> {
    return await this.repository.getTotalByMedicalRecordId(medicalRecordId);
  }
}
