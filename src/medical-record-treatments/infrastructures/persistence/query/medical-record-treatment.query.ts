// backend/src/medical-record-treatments/infrastructures/persistence/queries/medical-record-treatment.query.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { MedicalRecordTreatment } from '../../../domains/entities/medical-record-treatments.entity';

export interface TreatmentStatistics {
  totalTreatments: number;
  totalRevenue: number;
  averagePrice: number;
}

export interface TreatmentByCategory {
  categoryId: number;
  categoryName: string;
  totalTreatments: number;
  totalRevenue: number;
}

export interface MostUsedTreatment {
  treatmentId: number;
  treatmentName: string;
  usageCount: number;
  totalQuantity: number;
  totalRevenue: number;
}

export interface MonthlyRevenue {
  month: number;
  revenue: number;
  treatmentCount: number;
}

interface RawStatisticsResult {
  totalTreatments: string;
  totalRevenue: string;
  averagePrice: string;
}

interface RawCategoryResult {
  categoryId: number;
  categoryName: string;
  totalTreatments: string;
  totalRevenue: string;
}

interface RawMostUsedResult {
  treatmentId: number;
  treatmentName: string;
  usageCount: string;
  totalQuantity: string;
  totalRevenue: string;
}

interface RawMonthlyRevenueResult {
  month: number;
  revenue: string;
  treatmentCount: string;
}

interface RawDiscountResult {
  totalDiscount: string;
}

@Injectable()
export class MedicalRecordTreatmentQuery {
  constructor(
    @InjectRepository(MedicalRecordTreatment)
    private readonly repository: Repository<MedicalRecordTreatment>,
  ) {}

  private createBaseQuery(): SelectQueryBuilder<MedicalRecordTreatment> {
    return this.repository
      .createQueryBuilder('mrt')
      .leftJoinAndSelect('mrt.treatment', 'treatment')
      .leftJoinAndSelect('treatment.category', 'category')
      .where('mrt.deletedAt IS NULL');
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<MedicalRecordTreatment[]> {
    return await this.createBaseQuery()
      .andWhere('mrt.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('mrt.createdAt', 'DESC')
      .getMany();
  }

  async findByTreatmentId(
    treatmentId: number,
  ): Promise<MedicalRecordTreatment[]> {
    return await this.createBaseQuery()
      .andWhere('mrt.treatmentId = :treatmentId', { treatmentId })
      .orderBy('mrt.createdAt', 'DESC')
      .getMany();
  }

  async getStatisticsByMedicalRecordId(
    medicalRecordId: number,
  ): Promise<TreatmentStatistics> {
    const result = await this.repository
      .createQueryBuilder('mrt')
      .select('COUNT(mrt.id)', 'totalTreatments')
      .addSelect('COALESCE(SUM(mrt.total), 0)', 'totalRevenue')
      .addSelect('COALESCE(AVG(mrt.hargaSatuan), 0)', 'averagePrice')
      .where('mrt.medicalRecordId = :medicalRecordId', { medicalRecordId })
      .andWhere('mrt.deletedAt IS NULL')
      .getRawOne<RawStatisticsResult>();

    return this.mapToStatistics(result);
  }

  async getStatisticsByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<TreatmentStatistics> {
    const result = await this.repository
      .createQueryBuilder('mrt')
      .select('COUNT(mrt.id)', 'totalTreatments')
      .addSelect('COALESCE(SUM(mrt.total), 0)', 'totalRevenue')
      .addSelect('COALESCE(AVG(mrt.hargaSatuan), 0)', 'averagePrice')
      .where('mrt.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('mrt.deletedAt IS NULL')
      .getRawOne<RawStatisticsResult>();

    return this.mapToStatistics(result);
  }

  async getTreatmentsByCategory(
    medicalRecordId?: number,
  ): Promise<TreatmentByCategory[]> {
    let query = this.repository
      .createQueryBuilder('mrt')
      .leftJoin('mrt.treatment', 'treatment')
      .leftJoin('treatment.category', 'category')
      .select('category.id', 'categoryId')
      .addSelect('category.namaKategori', 'categoryName')
      .addSelect('COUNT(mrt.id)', 'totalTreatments')
      .addSelect('COALESCE(SUM(mrt.total), 0)', 'totalRevenue')
      .where('mrt.deletedAt IS NULL')
      .groupBy('category.id')
      .addGroupBy('category.namaKategori');

    if (medicalRecordId) {
      query = query.andWhere('mrt.medicalRecordId = :medicalRecordId', {
        medicalRecordId,
      });
    }

    const results = await query.getRawMany<RawCategoryResult>();

    return results.map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      totalTreatments: parseInt(r.totalTreatments) || 0,
      totalRevenue: parseFloat(r.totalRevenue) || 0,
    }));
  }

  async getMostUsedTreatments(
    limit: number = 10,
  ): Promise<MostUsedTreatment[]> {
    const results = await this.repository
      .createQueryBuilder('mrt')
      .leftJoinAndSelect('mrt.treatment', 'treatment')
      .select('treatment.id', 'treatmentId')
      .addSelect('treatment.namaPerawatan', 'treatmentName')
      .addSelect('COUNT(mrt.id)', 'usageCount')
      .addSelect('SUM(mrt.jumlah)', 'totalQuantity')
      .addSelect('COALESCE(SUM(mrt.total), 0)', 'totalRevenue')
      .where('mrt.deletedAt IS NULL')
      .groupBy('treatment.id')
      .addGroupBy('treatment.namaPerawatan')
      .orderBy('usageCount', 'DESC')
      .limit(limit)
      .getRawMany<RawMostUsedResult>();

    return results.map((r) => ({
      treatmentId: r.treatmentId,
      treatmentName: r.treatmentName,
      usageCount: parseInt(r.usageCount) || 0,
      totalQuantity: parseInt(r.totalQuantity) || 0,
      totalRevenue: parseFloat(r.totalRevenue) || 0,
    }));
  }

  async getRevenueByMonth(year: number): Promise<MonthlyRevenue[]> {
    const results = await this.repository
      .createQueryBuilder('mrt')
      .select('MONTH(mrt.createdAt)', 'month')
      .addSelect('COALESCE(SUM(mrt.total), 0)', 'revenue')
      .addSelect('COUNT(mrt.id)', 'treatmentCount')
      .where('YEAR(mrt.createdAt) = :year', { year })
      .andWhere('mrt.deletedAt IS NULL')
      .groupBy('MONTH(mrt.createdAt)')
      .orderBy('month', 'ASC')
      .getRawMany<RawMonthlyRevenueResult>();

    return results.map((r) => ({
      month: r.month,
      revenue: parseFloat(r.revenue) || 0,
      treatmentCount: parseInt(r.treatmentCount) || 0,
    }));
  }

  async getTotalDiscountByMedicalRecordId(
    medicalRecordId: number,
  ): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('mrt')
      .select('COALESCE(SUM(mrt.diskon), 0)', 'totalDiscount')
      .where('mrt.medicalRecordId = :medicalRecordId', { medicalRecordId })
      .andWhere('mrt.deletedAt IS NULL')
      .getRawOne<RawDiscountResult>();

    return parseFloat(result?.totalDiscount || '0');
  }

  /**
   * Helper untuk memetakan hasil raw statistics
   */
  private mapToStatistics(
    result: RawStatisticsResult | undefined,
  ): TreatmentStatistics {
    if (!result) {
      return {
        totalTreatments: 0,
        totalRevenue: 0,
        averagePrice: 0,
      };
    }

    return {
      totalTreatments: parseInt(result.totalTreatments) || 0,
      totalRevenue: parseFloat(result.totalRevenue) || 0,
      averagePrice: parseFloat(result.averagePrice) || 0,
    };
  }
}
