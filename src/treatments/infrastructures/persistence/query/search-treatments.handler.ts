// backend/src/treatments/infrastructures/persistence/query-handlers/search-treatments.handler.ts
import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { SearchTreatmentsQuery } from '../query/search-treatments.query';
import { TreatmentRepository } from '../repositories/treatment.repository';
import { TreatmentMapper } from '../../../domains/mappers/treatment.mapper';

@Injectable()
@QueryHandler(SearchTreatmentsQuery)
export class SearchTreatmentsHandler implements IQueryHandler<SearchTreatmentsQuery> {
  constructor(
    private readonly repository: TreatmentRepository,
    private readonly mapper: TreatmentMapper,
  ) {}

  async execute(query: SearchTreatmentsQuery) {
    const { data } = await this.repository.findAll({
      search: query.keyword,
      categoryId: query.categoryId,
      isActive: true,
      page: 1,
      limit: 50,
    });

    return this.mapper.toListResponseDtoList(data);
  }
}
