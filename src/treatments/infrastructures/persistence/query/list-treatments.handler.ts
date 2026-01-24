// backend/src/treatments/infrastructures/persistence/query-handlers/list-treatments.handler.ts
import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ListTreatmentsQuery } from '../query/list-treatments.query';
import { TreatmentRepository } from '../repositories/treatment.repository';
import { TreatmentMapper } from '../../../domains/mappers/treatment.mapper';

@Injectable()
@QueryHandler(ListTreatmentsQuery)
export class ListTreatmentsHandler implements IQueryHandler<ListTreatmentsQuery> {
  constructor(
    private readonly repository: TreatmentRepository,
    private readonly mapper: TreatmentMapper,
  ) {}

  async execute(query: ListTreatmentsQuery) {
    const { data, total } = await this.repository.findAll(query.filters);
    const { page = 1, limit = 10 } = query.filters;

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
