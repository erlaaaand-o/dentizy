// backend/src/treatment-categories/applications/use-cases/restore-treatment-category.usecase.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { TreatmentCategoryRepository } from '../../infrastructures/persistence/repositories/treatment-category.repository';
import { TreatmentCategoryMapper } from '../../domains/mappers/treatment-category.mapper';
import { TreatmentCategoryResponseDto } from '../dto/treatment-category-response.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TreatmentCategoryRestoredEvent } from '../../infrastructures/events/treatment-category-restored.event';

@Injectable()
export class RestoreTreatmentCategoryUseCase {
  constructor(
    private readonly repository: TreatmentCategoryRepository,
    private readonly mapper: TreatmentCategoryMapper,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(id: string): Promise<TreatmentCategoryResponseDto> {
    // Restore
    await this.repository.restore(id);

    // Find restored entity
    const category = await this.repository.findOne(id);

    if (!category) {
      throw new NotFoundException(
        `Kategori perawatan dengan ID ${id} tidak ditemukan`,
      );
    }

    // Emit event
    const event = new TreatmentCategoryRestoredEvent(
      id,
      category.namaKategori,
      new Date(),
    );
    this.eventEmitter.emit('treatment-category.restored', event);

    return this.mapper.toResponseDto(category);
  }
}
