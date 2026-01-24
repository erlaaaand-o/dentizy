// backend/src/treatment-categories/applications/use-cases/find-treatment-categories.usecase.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { TreatmentCategoryRepository } from '../../infrastructures/persistence/repositories/treatment-category.repository';
import { QueryTreatmentCategoryDto } from '../dto/query-treatment-category.dto';
import { TreatmentCategoryMapper } from '../../domains/mappers/treatment-category.mapper';
import { TreatmentCategoryResponseDto } from '../dto/treatment-category-response.dto';
import { PaginatedResponseDto } from '../../applications/dto/paginated-response.dto';

@Injectable()
export class FindTreatmentCategoriesUseCase {
  constructor(
    private readonly repository: TreatmentCategoryRepository,
    private readonly mapper: TreatmentCategoryMapper,
  ) {}

  async findAll(
    query: QueryTreatmentCategoryDto,
  ): Promise<PaginatedResponseDto<TreatmentCategoryResponseDto>> {
    const { data, total } = await this.repository.findAll(query);
    const { page = 1, limit = 10 } = query;

    return {
      data: data.map((item) => this.mapper.toResponseDto(item)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<TreatmentCategoryResponseDto> {
    const category = await this.repository.findOne(id);

    if (!category) {
      throw new NotFoundException(
        `Kategori perawatan dengan ID ${id} tidak ditemukan`,
      );
    }

    return this.mapper.toResponseDto(category);
  }
}
