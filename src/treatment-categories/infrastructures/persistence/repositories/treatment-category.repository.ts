// backend/src/treatment-categories/infrastructures/persistence/repositories/treatment-category.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TreatmentCategory } from '../../../domains/entities/treatment-categories.entity';
import { CreateTreatmentCategoryDto } from '../../../applications/dto/create-treatment-category.dto';
import { UpdateTreatmentCategoryDto } from '../../../applications/dto/update-treatment-category.dto';
import { QueryTreatmentCategoryDto } from '../../../applications/dto/query-treatment-category.dto';
import { TreatmentCategoryQueries } from '../query/treatment-category.queries';
import { CategoryWithTreatmentCountDto } from '../../../../treatment-categories/applications/dto/category-with-treatment-count.dto';

@Injectable()
export class TreatmentCategoryRepository {
  constructor(
    @InjectRepository(TreatmentCategory)
    private readonly repository: Repository<TreatmentCategory>,
    private readonly queries: TreatmentCategoryQueries,
  ) {}

  async create(dto: CreateTreatmentCategoryDto): Promise<TreatmentCategory> {
    const category = this.repository.create(dto);
    return await this.repository.save(category);
  }

  async findAll(
    query: QueryTreatmentCategoryDto,
  ): Promise<{ data: TreatmentCategory[]; total: number }> {
    return await this.queries.findAllWithFilters(query);
  }

  async findOne(id: string): Promise<TreatmentCategory | null> {
    return await this.queries.findById(id);
  }

  async findByName(name: string): Promise<TreatmentCategory | null> {
    return await this.queries.findByName(name);
  }

  async findActiveCategories(): Promise<TreatmentCategory[]> {
    return await this.queries.findActiveCategories();
  }

  async update(
    id: string,
    dto: UpdateTreatmentCategoryDto,
  ): Promise<TreatmentCategory | null> {
    await this.repository.update(id, dto);
    return await this.findOne(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await this.repository.restore(id);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } });
    return count > 0;
  }

  async hasActiveTreatments(categoryId: string): Promise<boolean> {
    const count = await this.queries.countTreatmentsByCategory(categoryId);
    return count > 0;
  }

  async countTreatments(categoryId: string): Promise<number> {
    return await this.queries.countTreatmentsByCategory(categoryId);
  }

  async getCategoriesWithCount(): Promise<CategoryWithTreatmentCountDto[]> {
    return await this.queries.getCategoriesWithTreatmentCount();
  }

  async searchByKeyword(
    keyword: string,
    limit?: number,
  ): Promise<TreatmentCategory[]> {
    return await this.queries.searchByKeyword(keyword, limit);
  }
}
