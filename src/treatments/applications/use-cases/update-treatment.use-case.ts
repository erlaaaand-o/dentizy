// backend/src/treatments/applications/use-cases/update-treatment.use-case.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TreatmentRepository } from '../../infrastructures/persistence/repositories/treatment.repository';
import { TreatmentCategoryRepository } from '../../../treatment-categories/infrastructures/persistence/repositories/treatment-category.repository';
import { UpdateTreatmentDto } from '../dto/update-treatment.dto';
import { TreatmentResponseDto } from '../dto/treatment-response.dto';
import { TreatmentMapper } from '../../domains/mappers/treatment.mapper';
import { TreatmentBusinessService } from '../../domains/services/treatment-business.service';
import { TreatmentUpdatedEvent } from '../../infrastructures/events/treatment-updated.event';
import { TreatmentPriceChangedEvent } from '../../infrastructures/events/treatment-price-changed.event';

@Injectable()
export class UpdateTreatmentUseCase {
  constructor(
    private readonly treatmentRepository: TreatmentRepository,
    private readonly categoryRepository: TreatmentCategoryRepository,
    private readonly treatmentMapper: TreatmentMapper,
    private readonly businessService: TreatmentBusinessService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    id: string,
    dto: UpdateTreatmentDto,
  ): Promise<TreatmentResponseDto> {
    // Check if treatment exists
    const existingTreatment = await this.treatmentRepository.findOne(id);
    if (!existingTreatment) {
      throw new NotFoundException(`Perawatan dengan ID ${id} tidak ditemukan`);
    }

    // Check if can be updated
    const canUpdate = this.businessService.canBeUpdated(existingTreatment);
    if (!canUpdate.allowed) {
      throw new ConflictException(canUpdate.reason);
    }

    // Validate category if provided
    if (dto.categoryId) {
      const categoryExists = await this.categoryRepository.exists(
        dto.categoryId,
      );
      if (!categoryExists) {
        throw new NotFoundException(
          `Kategori dengan ID ${dto.categoryId} tidak ditemukan`,
        );
      }
    }

    // Check code uniqueness if provided
    // if (dto.kodePerawatan) {
    //     const kodeExists = await this.treatmentRepository.isKodeExists(dto.kodePerawatan, id);
    //     if (kodeExists) {
    //         throw new ConflictException(`Kode perawatan ${dto.kodePerawatan} sudah digunakan`);
    //     }
    // }

    // Track price change
    const oldPrice = existingTreatment.harga;
    const newPrice = dto.harga !== undefined ? dto.harga : oldPrice;

    // Update treatment
    const updatedTreatment = await this.treatmentRepository.update(id, dto);

    // Emit events
    this.eventEmitter.emit(
      'treatment.updated',
      new TreatmentUpdatedEvent(id, dto, new Date()),
    );

    if (oldPrice !== newPrice) {
      this.eventEmitter.emit(
        'treatment.price.changed',
        new TreatmentPriceChangedEvent(id, oldPrice, newPrice, new Date()),
      );
    }

    if (!updatedTreatment) {
      throw new NotFoundException(
        `Perawatan dengan ID ${id} tidak ditemukan setelah update`,
      );
    }

    return this.treatmentMapper.toResponseDto(updatedTreatment);
  }
}
