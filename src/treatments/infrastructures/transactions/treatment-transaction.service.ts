// backend/src/treatments/infrastructures/persistence/transactions/treatment-transaction.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, QueryRunner } from 'typeorm';
import { Treatment } from '../../domains/entities/treatments.entity';

@Injectable()
export class TreatmentTransactionService {
  constructor(
    @InjectRepository(Treatment)
    private readonly repository: Repository<Treatment>,
    private readonly dataSource: DataSource,
  ) {}

  async withTransaction<T>(
    work: (queryRunner: QueryRunner) => Promise<T>,
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await work(queryRunner);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async bulkCreate(treatments: Partial<Treatment>[]): Promise<Treatment[]> {
    return await this.withTransaction(async (queryRunner) => {
      const createdTreatments: Treatment[] = [];

      for (const treatmentData of treatments) {
        const treatment = queryRunner.manager.create(Treatment, treatmentData);
        const saved = await queryRunner.manager.save(treatment);
        createdTreatments.push(saved);
      }

      return createdTreatments;
    });
  }

  async bulkUpdate(
    updates: { id: number; data: Partial<Treatment> }[],
  ): Promise<void> {
    await this.withTransaction(async (queryRunner) => {
      for (const update of updates) {
        await queryRunner.manager.update(Treatment, update.id, update.data);
      }
    });
  }

  async bulkDelete(ids: number[]): Promise<void> {
    await this.withTransaction(async (queryRunner) => {
      for (const id of ids) {
        await queryRunner.manager.softDelete(Treatment, id);
      }
    });
  }

  async transferCategory(
    fromCategoryId: string,
    toCategoryId: string,
  ): Promise<number> {
    return await this.withTransaction(async (queryRunner) => {
      const result = await queryRunner.manager.update(
        Treatment,
        { categoryId: fromCategoryId },
        { categoryId: toCategoryId },
      );

      return result.affected || 0;
    });
  }

  async bulkPriceAdjustment(
    categoryId: string,
    adjustmentPercentage: number,
  ): Promise<number> {
    return await this.withTransaction(async (queryRunner) => {
      const treatments = await queryRunner.manager.find(Treatment, {
        where: { categoryId },
      });

      for (const treatment of treatments) {
        const newPrice = treatment.harga * (1 + adjustmentPercentage / 100);
        await queryRunner.manager.update(Treatment, treatment.id, {
          harga: Math.round(newPrice * 100) / 100,
        });
      }

      return treatments.length;
    });
  }

  async cloneTreatment(
    treatmentId: string,
    newKodePerawatan: string,
    newNamaPerawatan: string,
  ): Promise<Treatment> {
    return await this.withTransaction(async (queryRunner) => {
      const original = await queryRunner.manager.findOne(Treatment, {
        where: { id: treatmentId },
      });

      if (!original) {
        throw new Error('Original treatment not found');
      }

      const cloned = queryRunner.manager.create(Treatment, {
        ...original,
        id: undefined,
        kodePerawatan: newKodePerawatan,
        namaPerawatan: newNamaPerawatan,
        createdAt: undefined,
        updatedAt: undefined,
      });

      return await queryRunner.manager.save(cloned);
    });
  }

  async moveToCategory(
    treatmentIds: number[],
    newCategoryId: number,
  ): Promise<number> {
    return await this.withTransaction(async (queryRunner) => {
      const result = await queryRunner.manager
        .createQueryBuilder()
        .update(Treatment)
        .set({ categoryId: newCategoryId })
        .whereInIds(treatmentIds)
        .execute();

      return result.affected || 0;
    });
  }

  async activateMultiple(ids: number[]): Promise<number> {
    return await this.withTransaction(async (queryRunner) => {
      const result = await queryRunner.manager
        .createQueryBuilder()
        .update(Treatment)
        .set({ isActive: true })
        .whereInIds(ids)
        .execute();

      return result.affected || 0;
    });
  }

  async deactivateMultiple(ids: number[]): Promise<number> {
    return await this.withTransaction(async (queryRunner) => {
      const result = await queryRunner.manager
        .createQueryBuilder()
        .update(Treatment)
        .set({ isActive: false })
        .whereInIds(ids)
        .execute();

      return result.affected || 0;
    });
  }
}
