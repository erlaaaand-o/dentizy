// backend/src/treatment-categories/applications/use-cases/create-treatment-category.usecase.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { TreatmentCategoryRepository } from '../../infrastructures/persistence/repositories/treatment-category.repository';
import { CreateTreatmentCategoryDto } from '../dto/create-treatment-category.dto';
import { TreatmentCategoryMapper } from '../../domains/mappers/treatment-category.mapper';
import { TreatmentCategoryResponseDto } from '../dto/treatment-category-response.dto';
import { TreatmentCategoryValidator } from '../../domains/validators/treatment-category.validator';
import { TreatmentCategoryCreatedEvent } from '../../infrastructures/events/treatment-category-created.event';

@Injectable()
export class CreateTreatmentCategoryUseCase {
  constructor(
    private readonly repository: TreatmentCategoryRepository,
    private readonly mapper: TreatmentCategoryMapper,
    private readonly validator: TreatmentCategoryValidator,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    dto: CreateTreatmentCategoryDto,
  ): Promise<TreatmentCategoryResponseDto> {
    // Validate business rules
    await this.validator.validateCreate(dto);

    try {
      // Create entity
      const category = await this.repository.create(dto);

      // Emit event
      const event = new TreatmentCategoryCreatedEvent(
        category.id,
        category.namaKategori,
        category.createdAt,
      );
      this.eventEmitter.emit('treatment-category.created', event);

      // Map to response DTO
      return this.mapper.toResponseDto(category);
    } catch (error) {
      throw new BadRequestException('Gagal membuat kategori perawatan');
    }
  }
}
