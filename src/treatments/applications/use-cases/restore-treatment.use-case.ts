// backend/src/treatments/applications/use-cases/restore-treatment.use-case.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TreatmentRepository } from '../../infrastructures/persistence/repositories/treatment.repository';
import { TreatmentResponseDto } from '../dto/treatment-response.dto';
import { TreatmentMapper } from '../../domains/mappers/treatment.mapper';
import { TreatmentRestoredEvent } from '../../infrastructures/events/treatment-restored.event';

@Injectable()
export class RestoreTreatmentUseCase {
  constructor(
    private readonly treatmentRepository: TreatmentRepository,
    private readonly treatmentMapper: TreatmentMapper,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(id: string): Promise<TreatmentResponseDto> {
    await this.treatmentRepository.restore(id);
    const treatment = await this.treatmentRepository.findOne(id);

    if (!treatment) {
      throw new NotFoundException(`Perawatan dengan ID ${id} tidak ditemukan`);
    }

    this.eventEmitter.emit(
      'treatment.restored',
      new TreatmentRestoredEvent(id, treatment.kodePerawatan, new Date()),
    );

    return this.treatmentMapper.toResponseDto(treatment);
  }
}
