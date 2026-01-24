// backend/src/treatments/infrastructures/persistence/query-handlers/get-active-treatments.handler.ts
import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetActiveTreatmentsQuery } from '../query/get-active-treatments.query';
import { TreatmentRepository } from '../repositories/treatment.repository';
import { TreatmentMapper } from '../../../domains/mappers/treatment.mapper';

@Injectable()
@QueryHandler(GetActiveTreatmentsQuery)
export class GetActiveTreatmentsHandler implements IQueryHandler<GetActiveTreatmentsQuery> {
  constructor(
    private readonly repository: TreatmentRepository,
    private readonly mapper: TreatmentMapper,
  ) {}

  async execute(query: GetActiveTreatmentsQuery) {
    const { data } = await this.repository.findAll({
      categoryId: query.categoryId,
      isActive: true,
      limit: query.limit || 100,
      page: 1,
    });

    return this.mapper.toResponseDtoList(data);
  }
}
