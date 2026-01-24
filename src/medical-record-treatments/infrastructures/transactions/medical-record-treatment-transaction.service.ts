// backend/src/medical-record-treatments/infrastructures/persistence/transaction/medical-record-treatment-transaction.service.ts
import { Injectable } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { MedicalRecordTreatment } from '../../domains/entities/medical-record-treatments.entity';
import { CreateMedicalRecordTreatmentDto } from '../../applications/dto/create-medical-record-treatment.dto';

export interface BulkCreateResult {
  success: boolean;
  created: MedicalRecordTreatment[];
  errors: Array<{ index: number; error: string }>;
}

@Injectable()
export class MedicalRecordTreatmentTransactionService {
  constructor(private readonly dataSource: DataSource) {}

  async bulkCreate(
    dtos: CreateMedicalRecordTreatmentDto[],
  ): Promise<BulkCreateResult> {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const created: MedicalRecordTreatment[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    try {
      for (let i = 0; i < dtos.length; i++) {
        try {
          const dto = dtos[i];
          const { jumlah, hargaSatuan, diskon = 0 } = dto;

          const subtotal = jumlah * hargaSatuan;
          const total = subtotal - diskon;

          const treatment = queryRunner.manager.create(MedicalRecordTreatment, {
            ...dto,
            subtotal,
            total,
          });

          const saved = await queryRunner.manager.save(treatment);
          created.push(saved);
        } catch (error) {
          errors.push({
            index: i,
            error: error.message || 'Unknown error',
          });
        }
      }

      if (errors.length > 0) {
        await queryRunner.rollbackTransaction();
        return { success: false, created: [], errors };
      }

      await queryRunner.commitTransaction();
      return { success: true, created, errors: [] };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async bulkDelete(
    ids: number[],
  ): Promise<{ success: boolean; deletedCount: number }> {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await queryRunner.manager.softDelete(
        MedicalRecordTreatment,
        ids,
      );

      await queryRunner.commitTransaction();
      return {
        success: true,
        deletedCount: result.affected || 0,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateMedicalRecordTreatments(
    medicalRecordId: string,
    treatments: CreateMedicalRecordTreatmentDto[],
  ): Promise<MedicalRecordTreatment[]> {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Delete existing treatments
      await queryRunner.manager.softDelete(MedicalRecordTreatment, {
        medicalRecordId,
      });

      // Create new treatments
      const created: MedicalRecordTreatment[] = [];
      for (const dto of treatments) {
        const { jumlah, hargaSatuan, diskon = 0 } = dto;
        const subtotal = jumlah * hargaSatuan;
        const total = subtotal - diskon;

        const treatment = queryRunner.manager.create(MedicalRecordTreatment, {
          ...dto,
          medicalRecordId,
          subtotal,
          total,
        });

        const saved = await queryRunner.manager.save(treatment);
        created.push(saved);
      }

      await queryRunner.commitTransaction();
      return created;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

// backend/src/medical-record-treatments/infrastructures/persistence/transaction/index.ts
export * from './medical-record-treatment-transaction.service';
