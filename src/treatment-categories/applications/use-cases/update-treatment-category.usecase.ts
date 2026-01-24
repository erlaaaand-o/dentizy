// backend/src/treatment-categories/applications/use-cases/update-treatment-category.usecase.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TreatmentCategoryRepository } from '../../infrastructures/persistence/repositories/treatment-category.repository';
import { UpdateTreatmentCategoryDto } from '../dto/update-treatment-category.dto';
import { TreatmentCategoryMapper } from '../../domains/mappers/treatment-category.mapper';
import { TreatmentCategoryResponseDto } from '../dto/treatment-category-response.dto';
import { TreatmentCategoryValidator } from '../../domains/validators/treatment-category.validator';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TreatmentCategoryUpdatedEvent } from '../../infrastructures/events/treatment-category-updated.event';

@Injectable()
export class UpdateTreatmentCategoryUseCase {
  constructor(
    private readonly repository: TreatmentCategoryRepository,
    private readonly mapper: TreatmentCategoryMapper,
    private readonly validator: TreatmentCategoryValidator,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    id: string,
    dto: UpdateTreatmentCategoryDto,
  ): Promise<TreatmentCategoryResponseDto> {
    // Check existence
    const exists = await this.repository.exists(id);
    if (!exists) {
      throw new NotFoundException(
        `Kategori perawatan dengan ID ${id} tidak ditemukan`,
      );
    }

    // Validate business rules
    await this.validator.validateUpdate(id, dto);

    try {
      // Update entity
      const category = await this.repository.update(id, dto);

      if (!category) {
        throw new NotFoundException(
          `Kategori perawatan dengan ID ${id} tidak ditemukan`,
        );
      }

      // Emit event
      const event = new TreatmentCategoryUpdatedEvent(
        category.id,
        category.namaKategori,
        category.updatedAt,
      );
      this.eventEmitter.emit('treatment-category.updated', event);

      // Map to response DTO
      return this.mapper.toResponseDto(category);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Gagal mengupdate kategori perawatan');
    }
  }
}
