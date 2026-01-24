// backend/src/treatments/applications/use-cases/create-treatment.use-case.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TreatmentRepository } from '../../infrastructures/persistence/repositories/treatment.repository';
import { TreatmentCategoryRepository } from '../../../treatment-categories/infrastructures/persistence/repositories/treatment-category.repository';
import { CreateTreatmentDto } from '../dto/create-treatment.dto';
import { TreatmentResponseDto } from '../dto/treatment-response.dto';
import { TreatmentMapper } from '../../domains/mappers/treatment.mapper';
import { TreatmentValidationService } from '../../domains/services/treatment-validation.service';
import { TreatmentCreatedEvent } from '../../infrastructures/events/treatment-created.event';
import { TreatmentsIdGenerator } from '../../infrastructures/generator/treatments-id.generator';

@Injectable()
export class CreateTreatmentUseCase {
  constructor(
    private readonly treatmentRepository: TreatmentRepository,
    private readonly categoryRepository: TreatmentCategoryRepository,
    private readonly treatmentMapper: TreatmentMapper,
    private readonly validationService: TreatmentValidationService,
    private readonly eventEmitter: EventEmitter2,
    private readonly idGenerator: TreatmentsIdGenerator,
  ) {}

  async execute(dto: CreateTreatmentDto): Promise<TreatmentResponseDto> {
    // Generate kode perawatan
    const newKode = await this.idGenerator.generateKodePerawatan();

    // Validate business rules
    const validation = this.validationService.validateTreatmentData({
      kodePerawatan: newKode,
      namaPerawatan: dto.namaPerawatan,
      harga: dto.harga,
    });

    if (!validation.isValid) {
      throw new ConflictException(validation.errors.join(', '));
    }

    // Check category exists
    const categoryExists = await this.categoryRepository.exists(dto.categoryId);
    if (!categoryExists) {
      throw new NotFoundException(
        `Kategori dengan ID ${dto.categoryId} tidak ditemukan`,
      );
    }

    // Create treatment entity data
    const treatmentData = this.treatmentMapper.toEntity(dto, newKode);

    // Create treatment
    const treatment = await this.treatmentRepository.create(treatmentData);

    // Emit event
    this.eventEmitter.emit(
      'treatment.created',
      new TreatmentCreatedEvent(
        treatment.id,
        treatment.kodePerawatan,
        treatment.namaPerawatan,
        treatment.categoryId,
        Number(treatment.harga),
        treatment.createdAt,
      ),
    );

    return this.treatmentMapper.toResponseDto(treatment);
  }
}
