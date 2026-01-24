// backend/src/treatment-categories/applications/use-cases/delete-treatment-category.usecase.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { TreatmentCategoryRepository } from '../../infrastructures/persistence/repositories/treatment-category.repository';
import { TreatmentCategoryValidator } from '../../domains/validators/treatment-category.validator';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TreatmentCategoryDeletedEvent } from '../../infrastructures/events/treatment-category-deleted.event';

@Injectable()
export class DeleteTreatmentCategoryUseCase {
  constructor(
    private readonly repository: TreatmentCategoryRepository,
    private readonly validator: TreatmentCategoryValidator,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(id: string): Promise<void> {
    // Check existence
    const category = await this.repository.findOne(id);
    if (!category) {
      throw new NotFoundException(
        `Kategori perawatan dengan ID ${id} tidak ditemukan`,
      );
    }

    // Validate deletion
    await this.validator.validateDelete(id);

    // Soft delete
    await this.repository.softDelete(id);

    // Emit event
    const event = new TreatmentCategoryDeletedEvent(
      id,
      category.namaKategori,
      new Date(),
    );
    this.eventEmitter.emit('treatment-category.deleted', event);
  }
}
