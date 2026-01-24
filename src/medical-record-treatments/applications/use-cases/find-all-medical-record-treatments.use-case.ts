// backend/src/medical-record-treatments/applications/use-cases/find-all-medical-record-treatments.use-case.ts
import { Injectable } from '@nestjs/common';
import { MedicalRecordTreatmentRepository } from '../../infrastructures/persistence/repositories/medical-record-treatment.repository';
import { MedicalRecordTreatmentMapper } from '../../domains/mappers/medical-record-treatment.mapper';
import { QueryMedicalRecordTreatmentDto } from '../dto/query-medical-record-treatment.dto';

@Injectable()
export class FindAllMedicalRecordTreatmentsUseCase {
  constructor(
    private readonly repository: MedicalRecordTreatmentRepository,
    private readonly mapper: MedicalRecordTreatmentMapper,
  ) {}

  async execute(query: QueryMedicalRecordTreatmentDto) {
    const { data, total } = await this.repository.findAll(query);
    const { page = 1, limit = 10 } = query;

    return {
      data: this.mapper.toResponseDtoList(data),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
