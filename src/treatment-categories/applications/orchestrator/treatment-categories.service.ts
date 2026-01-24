// backend/src/treatment-categories/applications/orchestrator/treatment-categories.service.ts
import { Injectable } from '@nestjs/common';
import { CreateTreatmentCategoryDto } from '../dto/create-treatment-category.dto';
import { UpdateTreatmentCategoryDto } from '../dto/update-treatment-category.dto';
import { QueryTreatmentCategoryDto } from '../dto/query-treatment-category.dto';
import { TreatmentCategoryResponseDto } from '../dto/treatment-category-response.dto';
import { PaginatedResponseDto } from '../dto/paginated-response.dto';
import { CreateTreatmentCategoryUseCase } from '../use-cases/create-treatment-category.usecase';
import { UpdateTreatmentCategoryUseCase } from '../use-cases/update-treatment-category.usecase';
import { DeleteTreatmentCategoryUseCase } from '../use-cases/delete-treatment-category.usecase';
import { FindTreatmentCategoriesUseCase } from '../use-cases/find-treatment-categories.usecase';
import { RestoreTreatmentCategoryUseCase } from '../use-cases/restore-treatment-category.usecase';

@Injectable()
export class TreatmentCategoriesService {
  constructor(
    private readonly createUseCase: CreateTreatmentCategoryUseCase,
    private readonly updateUseCase: UpdateTreatmentCategoryUseCase,
    private readonly deleteUseCase: DeleteTreatmentCategoryUseCase,
    private readonly findUseCase: FindTreatmentCategoriesUseCase,
    private readonly restoreUseCase: RestoreTreatmentCategoryUseCase,
  ) {}

  async create(
    dto: CreateTreatmentCategoryDto,
  ): Promise<TreatmentCategoryResponseDto> {
    return await this.createUseCase.execute(dto);
  }

  async findAll(
    query: QueryTreatmentCategoryDto,
  ): Promise<PaginatedResponseDto<TreatmentCategoryResponseDto>> {
    return await this.findUseCase.findAll(query);
  }

  async findOne(id: string): Promise<TreatmentCategoryResponseDto> {
    return await this.findUseCase.findOne(id);
  }

  async update(
    id: string,
    dto: UpdateTreatmentCategoryDto,
  ): Promise<TreatmentCategoryResponseDto> {
    return await this.updateUseCase.execute(id, dto);
  }

  async remove(id: string): Promise<void> {
    return await this.deleteUseCase.execute(id);
  }

  async restore(id: string): Promise<TreatmentCategoryResponseDto> {
    return await this.restoreUseCase.execute(id);
  }
}
