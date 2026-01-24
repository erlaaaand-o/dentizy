// backend/src/treatments/applications/use-cases/get-treatment-by-code.use-case.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { TreatmentRepository } from '../../infrastructures/persistence/repositories/treatment.repository';
import { TreatmentResponseDto } from '../dto/treatment-response.dto';
import { TreatmentMapper } from '../../domains/mappers/treatment.mapper';

@Injectable()
export class GetTreatmentByCodeUseCase {
  constructor(
    private readonly treatmentRepository: TreatmentRepository,
    private readonly treatmentMapper: TreatmentMapper,
  ) {}

  async execute(kodePerawatan: string): Promise<TreatmentResponseDto> {
    const treatment = await this.treatmentRepository.findByKode(kodePerawatan);

    if (!treatment) {
      throw new NotFoundException(
        `Perawatan dengan kode ${kodePerawatan} tidak ditemukan`,
      );
    }

    return this.treatmentMapper.toResponseDto(treatment);
  }
}
