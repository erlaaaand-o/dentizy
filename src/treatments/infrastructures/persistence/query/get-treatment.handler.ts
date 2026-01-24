// backend/src/treatments/infrastructures/persistence/query-handlers/get-treatment.handler.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetTreatmentQuery } from '../query/get-treatment.query';
import { TreatmentRepository } from '../repositories/treatment.repository';
import { TreatmentMapper } from '../../../domains/mappers/treatment.mapper';
import { TreatmentResponseDto } from '../../../applications/dto/treatment-response.dto';

@Injectable()
@QueryHandler(GetTreatmentQuery)
export class GetTreatmentHandler implements IQueryHandler<GetTreatmentQuery> {
  constructor(
    private readonly repository: TreatmentRepository,
    private readonly mapper: TreatmentMapper,
  ) {}

  async execute(query: GetTreatmentQuery): Promise<TreatmentResponseDto> {
    const treatment = await this.repository.findOne(query.id);

    if (!treatment) {
      throw new NotFoundException(
        `Perawatan dengan ID ${query.id} tidak ditemukan`,
      );
    }

    return this.mapper.toResponseDto(treatment);
  }
}
