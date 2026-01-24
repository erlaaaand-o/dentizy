// backend/src/treatment-categories/infrastructures/persistence/transactions/treatment-category-transaction.manager.ts
import { Injectable } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { TreatmentCategory } from '../../domains/entities/treatment-categories.entity';

@Injectable()
export class TreatmentCategoryTransactionManager {
  constructor(private readonly dataSource: DataSource) {}

  async runInTransaction<T>(
    operation: (queryRunner: QueryRunner) => Promise<T>,
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await operation(queryRunner);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async createWithTransaction(
    data: Partial<TreatmentCategory>,
  ): Promise<TreatmentCategory> {
    return this.runInTransaction(async (queryRunner) => {
      const repository = queryRunner.manager.getRepository(TreatmentCategory);
      const category = repository.create(data);
      return await repository.save(category);
    });
  }

  async updateWithTransaction(
    id: string,
    data: Partial<TreatmentCategory>,
  ): Promise<TreatmentCategory> {
    return this.runInTransaction(async (queryRunner) => {
      const repository = queryRunner.manager.getRepository(TreatmentCategory);
      await repository.update(id, data);
      const updated = await repository.findOne({ where: { id } });
      if (!updated) {
        throw new Error('Category not found after update');
      }
      return updated;
    });
  }

  async deleteWithTransaction(id: number): Promise<void> {
    await this.runInTransaction(async (queryRunner) => {
      const repository = queryRunner.manager.getRepository(TreatmentCategory);
      await repository.softDelete(id);
    });
  }

  async bulkCreateWithTransaction(
    dataList: Partial<TreatmentCategory>[],
  ): Promise<TreatmentCategory[]> {
    return this.runInTransaction(async (queryRunner) => {
      const repository = queryRunner.manager.getRepository(TreatmentCategory);
      const categories = repository.create(dataList);
      return await repository.save(categories);
    });
  }

  async bulkUpdateWithTransaction(
    updates: Array<{ id: number; data: Partial<TreatmentCategory> }>,
  ): Promise<void> {
    await this.runInTransaction(async (queryRunner) => {
      const repository = queryRunner.manager.getRepository(TreatmentCategory);

      for (const update of updates) {
        await repository.update(update.id, update.data);
      }
    });
  }
}
