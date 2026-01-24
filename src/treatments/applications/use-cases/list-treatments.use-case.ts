// backend/src/treatments/applications/use-cases/list-treatments.use-case.ts
import { Injectable } from '@nestjs/common';
import { TreatmentRepository } from '../../infrastructures/persistence/repositories/treatment.repository';
import { QueryTreatmentDto } from '../dto/query-treatment.dto';
import { TreatmentMapper } from '../../domains/mappers/treatment.mapper';

@Injectable()
export class ListTreatmentsUseCase {
  constructor(
    private readonly treatmentRepository: TreatmentRepository,
    private readonly treatmentMapper: TreatmentMapper,
  ) {}

  async execute(query: QueryTreatmentDto) {
    const { data, total } = await this.treatmentRepository.findAll(query);
    const { page = 1, limit = 10 } = query;

    return {
      data: this.treatmentMapper.toResponseDtoList(data),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
