// backend/src/treatments/applications/orchestrator/treatments.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TreatmentRepository } from '../../infrastructures/persistence/repositories/treatment.repository';
import { TreatmentCategoryRepository } from '../../../treatment-categories/infrastructures/persistence/repositories/treatment-category.repository';
import { CreateTreatmentDto } from '../dto/create-treatment.dto';
import { UpdateTreatmentDto } from '../dto/update-treatment.dto';
import { QueryTreatmentDto } from '../dto/query-treatment.dto';
import { TreatmentResponseDto } from '../dto/treatment-response.dto';
import { PaginatedTreatmentResponseDto } from '../dto/paginated-treatment-response.dto';
import { Treatment } from '../../domains/entities/treatments.entity';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

@Injectable()
export class TreatmentsService {
  constructor(
    private readonly treatmentRepository: TreatmentRepository,
    private readonly categoryRepository: TreatmentCategoryRepository,
  ) {}

  async create(dto: CreateTreatmentDto): Promise<TreatmentResponseDto> {
    // Validate category exists
    const categoryExists = await this.categoryRepository.exists(dto.categoryId);
    if (!categoryExists) {
      throw new NotFoundException(
        `Kategori dengan ID ${dto.categoryId} tidak ditemukan`,
      );
    }

    try {
      // Note: This method requires kode to be generated elsewhere
      // Consider using CreateTreatmentUseCase instead for production
      throw new BadRequestException(
        'Use CreateTreatmentUseCase for creating treatments',
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Gagal membuat perawatan');
    }
  }

  async findAll(
    query: QueryTreatmentDto,
  ): Promise<PaginatedTreatmentResponseDto> {
    const { data, total } = await this.treatmentRepository.findAll(query);
    const { page = 1, limit = 10 } = query;

    return {
      data: data.map((item) => this.mapToResponseDto(item)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<TreatmentResponseDto> {
    const treatment = await this.treatmentRepository.findOne(id);

    if (!treatment) {
      throw new NotFoundException(`Perawatan dengan ID ${id} tidak ditemukan`);
    }

    return this.mapToResponseDto(treatment);
  }

  async findByKode(kodePerawatan: string): Promise<TreatmentResponseDto> {
    const treatment = await this.treatmentRepository.findByKode(kodePerawatan);

    if (!treatment) {
      throw new NotFoundException(
        `Perawatan dengan kode ${kodePerawatan} tidak ditemukan`,
      );
    }

    return this.mapToResponseDto(treatment);
  }

  async update(
    id: string,
    dto: UpdateTreatmentDto,
  ): Promise<TreatmentResponseDto> {
    const exists = await this.treatmentRepository.exists(id);

    if (!exists) {
      throw new NotFoundException(`Perawatan dengan ID ${id} tidak ditemukan`);
    }

    // Validate category if provided
    if (dto.categoryId !== undefined) {
      const categoryExists = await this.categoryRepository.exists(
        dto.categoryId,
      );
      if (!categoryExists) {
        throw new NotFoundException(
          `Kategori dengan ID ${dto.categoryId} tidak ditemukan`,
        );
      }
    }

    try {
      const treatment = await this.treatmentRepository.update(id, dto);
      if (!treatment) {
        throw new NotFoundException(
          `Perawatan dengan ID ${id} tidak ditemukan setelah update`,
        );
      }
      return this.mapToResponseDto(treatment);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Gagal mengupdate perawatan');
    }
  }

  async remove(id: string): Promise<void> {
    const exists = await this.treatmentRepository.exists(id);

    if (!exists) {
      throw new NotFoundException(`Perawatan dengan ID ${id} tidak ditemukan`);
    }

    await this.treatmentRepository.softDelete(id);
  }

  async restore(id: string): Promise<TreatmentResponseDto> {
    await this.treatmentRepository.restore(id);
    const treatment = await this.treatmentRepository.findOne(id);

    if (!treatment) {
      throw new NotFoundException(`Perawatan dengan ID ${id} tidak ditemukan`);
    }

    return this.mapToResponseDto(treatment);
  }

  private mapToResponseDto(treatment: Treatment): TreatmentResponseDto {
    return new TreatmentResponseDto({
      id: treatment.id,
      categoryId: treatment.categoryId,
      kodePerawatan: treatment.kodePerawatan,
      namaPerawatan: treatment.namaPerawatan,
      deskripsi: treatment.deskripsi,
      harga: Number(treatment.harga),
      durasiEstimasi: treatment.durasiEstimasi,
      isActive: treatment.isActive,
      createdAt: treatment.createdAt,
      updatedAt: treatment.updatedAt,
      category: treatment.category
        ? {
            id: treatment.category.id,
            namaKategori: treatment.category.namaKategori,
          }
        : undefined,
    });
  }
}
