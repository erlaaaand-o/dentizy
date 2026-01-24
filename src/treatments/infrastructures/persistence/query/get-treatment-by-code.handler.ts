// backend/src/treatments/infrastructures/persistence/query-handlers/get-treatment-by-code.handler.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetTreatmentByCodeQuery } from '../query/get-treatment-by-code.query';
import { TreatmentRepository } from '../repositories/treatment.repository';
import { TreatmentMapper } from '../../../domains/mappers/treatment.mapper';
import { TreatmentResponseDto } from '../../../applications/dto/treatment-response.dto';

@Injectable()
@QueryHandler(GetTreatmentByCodeQuery)
export class GetTreatmentByCodeHandler implements IQueryHandler<GetTreatmentByCodeQuery> {
  constructor(
    private readonly repository: TreatmentRepository,
    private readonly mapper: TreatmentMapper,
  ) {}

  async execute(query: GetTreatmentByCodeQuery): Promise<TreatmentResponseDto> {
    const treatment = await this.repository.findByKode(query.kodePerawatan);

    if (!treatment) {
      throw new NotFoundException(
        `Perawatan dengan kode ${query.kodePerawatan} tidak ditemukan`,
      );
    }

    return this.mapper.toResponseDto(treatment);
  }
}
