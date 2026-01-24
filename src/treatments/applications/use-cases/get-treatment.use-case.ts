// backend/src/treatments/applications/use-cases/get-treatment.use-case.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { TreatmentRepository } from '../../infrastructures/persistence/repositories/treatment.repository';
import { TreatmentResponseDto } from '../dto/treatment-response.dto';
import { TreatmentMapper } from '../../domains/mappers/treatment.mapper';

@Injectable()
export class GetTreatmentUseCase {
  constructor(
    private readonly treatmentRepository: TreatmentRepository,
    private readonly treatmentMapper: TreatmentMapper,
  ) {}

  async execute(id: string): Promise<TreatmentResponseDto> {
    const treatment = await this.treatmentRepository.findOne(id);

    if (!treatment) {
      throw new NotFoundException(`Perawatan dengan ID ${id} tidak ditemukan`);
    }

    return this.treatmentMapper.toResponseDto(treatment);
  }
}
