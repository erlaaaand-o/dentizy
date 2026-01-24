// backend/src/treatment-categories/infrastructures/persistence/queries/treatment-category.queries.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { TreatmentCategory } from '../../../domains/entities/treatment-categories.entity';
import { QueryTreatmentCategoryDto } from '../../../applications/dto/query-treatment-category.dto';
import { CategoryWithTreatmentCountDto } from '../../../../treatment-categories/applications/dto/category-with-treatment-count.dto';

@Injectable()
export class TreatmentCategoryQueries {
  constructor(
    @InjectRepository(TreatmentCategory)
    private readonly repository: Repository<TreatmentCategory>,
  ) {}

  private createBaseQuery(): SelectQueryBuilder<TreatmentCategory> {
    return this.repository
      .createQueryBuilder('category')
      .select([
        'category.id',
        'category.namaKategori',
        'category.deskripsi',
        'category.isActive',
        'category.createdAt',
        'category.updatedAt',
      ]);
  }

  async findAllWithFilters(
    query: QueryTreatmentCategoryDto,
  ): Promise<{ data: TreatmentCategory[]; total: number }> {
    const { search, isActive, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.createBaseQuery();

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(category.namaKategori LIKE :search OR category.deskripsi LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('category.isActive = :isActive', { isActive });
    }

    // Apply pagination and ordering
    queryBuilder.orderBy('category.createdAt', 'DESC').skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  async findById(id: string): Promise<TreatmentCategory | null> {
    return await this.repository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.treatments', 'treatments')
      .where('category.id = :id', { id })
      .getOne();
  }

  async findByName(name: string): Promise<TreatmentCategory | null> {
    return await this.repository
      .createQueryBuilder('category')
      .where('LOWER(category.namaKategori) = LOWER(:name)', { name })
      .getOne();
  }

  async findActiveCategories(): Promise<TreatmentCategory[]> {
    return await this.createBaseQuery()
      .where('category.isActive = :isActive', { isActive: true })
      .orderBy('category.namaKategori', 'ASC')
      .getMany();
  }

  async countTreatmentsByCategory(categoryId: string): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('category')
      .leftJoin('category.treatments', 'treatments')
      .where('category.id = :categoryId', { categoryId })
      .andWhere('treatments.deletedAt IS NULL')
      .select('COUNT(treatments.id)', 'count')
      .getRawOne();

    return parseInt(result?.count || '0', 10);
  }

  async getCategoriesWithTreatmentCount(): Promise<
    CategoryWithTreatmentCountDto[]
  > {
    return await this.repository
      .createQueryBuilder('category')
      .leftJoin(
        'category.treatments',
        'treatments',
        'treatments.deletedAt IS NULL',
      )
      .select([
        'category.id as id',
        'category.namaKategori as namaKategori',
        'category.deskripsi as deskripsi',
        'category.isActive as isActive',
        'COUNT(treatments.id) as treatmentCount',
      ])
      .groupBy('category.id')
      .orderBy('category.namaKategori', 'ASC')
      .getRawMany();
  }

  async searchByKeyword(
    keyword: string,
    limit: number = 10,
  ): Promise<TreatmentCategory[]> {
    return await this.createBaseQuery()
      .where('category.namaKategori LIKE :keyword', { keyword: `%${keyword}%` })
      .andWhere('category.isActive = :isActive', { isActive: true })
      .take(limit)
      .getMany();
  }
}
