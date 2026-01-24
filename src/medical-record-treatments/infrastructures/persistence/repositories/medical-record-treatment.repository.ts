// backend/src/medical-record-treatments/infrastructures/persistence/repositories/medical-record-treatment.repository.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, SelectQueryBuilder } from 'typeorm';
import { MedicalRecordTreatment } from '../../../domains/entities/medical-record-treatments.entity';
import { CreateMedicalRecordTreatmentDto } from '../../../applications/dto/create-medical-record-treatment.dto';
import { UpdateMedicalRecordTreatmentDto } from '../../../applications/dto/update-medical-record-treatment.dto';
import { QueryMedicalRecordTreatmentDto } from '../../../applications/dto/query-medical-record-treatment.dto';

// Interface untuk return value method getTopTreatments
export interface TopTreatmentStatistics {
  treatmentName: string;
  usageCount: number;
  totalRevenue: number;
}

// Interface untuk hasil RAW dari database (TypeORM mengembalikan string untuk fungsi agregat)
interface RawTopTreatmentResult {
  treatmentName: string;
  usageCount: string;
  totalRevenue: string;
}

// Interface untuk hasil RAW total
interface RawTotalResult {
  total: string; // Decimal/SUM result usually comes as string
}

@Injectable()
export class MedicalRecordTreatmentRepository {
  constructor(
    @InjectRepository(MedicalRecordTreatment)
    private readonly repository: Repository<MedicalRecordTreatment>,
  ) {}

  async create(
    dto: CreateMedicalRecordTreatmentDto,
  ): Promise<MedicalRecordTreatment> {
    const { jumlah, hargaSatuan, diskon = 0 } = dto;

    const subtotal = jumlah * hargaSatuan;
    const total = subtotal - diskon;

    const treatment = this.repository.create({
      ...dto,
      subtotal,
      total,
    });

    return await this.repository.save(treatment);
  }

  async findAll(
    query: QueryMedicalRecordTreatmentDto,
  ): Promise<{ data: MedicalRecordTreatment[]; total: number }> {
    const { medicalRecordId, treatmentId, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<MedicalRecordTreatment> = {};

    if (medicalRecordId) {
      where.medicalRecordId = medicalRecordId;
    }

    if (treatmentId) {
      where.treatmentId = treatmentId;
    }

    const [data, total] = await this.repository.findAndCount({
      where,
      relations: ['treatment', 'treatment.category'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { data, total };
  }

  async findOne(id: string): Promise<MedicalRecordTreatment | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['treatment', 'treatment.category'],
    });
  }

  async findByMedicalRecordId(
    medicalRecordId: string,
  ): Promise<MedicalRecordTreatment[]> {
    return await this.repository.find({
      where: { medicalRecordId },
      relations: ['treatment', 'treatment.category'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    dto: UpdateMedicalRecordTreatmentDto,
  ): Promise<MedicalRecordTreatment> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException(
        `Medical Record Treatment with ID ${id} not found`,
      );
    }

    // Pastikan konversi ke Number untuk perhitungan yang aman
    const jumlah = dto.jumlah ?? existing.jumlah;
    const hargaSatuan = dto.hargaSatuan ?? Number(existing.hargaSatuan);
    const diskon = dto.diskon ?? Number(existing.diskon);

    const subtotal = jumlah * hargaSatuan;
    const total = subtotal - diskon;

    await this.repository.update(id, {
      ...dto,
      subtotal,
      total,
    });

    const updated = await this.findOne(id);
    if (!updated) {
      throw new NotFoundException(
        `Medical Record Treatment with ID ${id} not found after update`,
      );
    }

    return updated;
  }

  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await this.repository.restore(id);
  }

  async getTotalByMedicalRecordId(medicalRecordId: string): Promise<number> {
    // Gunakan Generic Type <RawTotalResult> agar result.total dikenali
    const result = await this.repository
      .createQueryBuilder('mrt')
      .select('SUM(mrt.total)', 'total')
      .where('mrt.medicalRecordId = :medicalRecordId', { medicalRecordId })
      .andWhere('mrt.deletedAt IS NULL')
      .getRawOne<RawTotalResult>();

    // Safety check dan parsing
    return result && result.total ? parseFloat(result.total) : 0;
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } });
    return count > 0;
  }

  /**
   * Get top treatments statistics
   */
  async getTopTreatments(
    limit: number = 10,
    startDate?: Date,
    endDate?: Date,
  ): Promise<TopTreatmentStatistics[]> {
    const query = this.repository
      .createQueryBuilder('mrt')
      .leftJoin('mrt.treatment', 'treatment')
      .select([
        'treatment.namaPerawatan AS treatmentName',
        'COUNT(mrt.id) AS usageCount',
        'SUM(mrt.subtotal) AS totalRevenue',
      ])
      .where('mrt.deletedAt IS NULL') // Tambahkan filter deletedAt untuk akurasi
      .groupBy('treatment.id')
      .addGroupBy('treatment.namaPerawatan') // PostgreSQL butuh ini jika tidak diagregasi
      .orderBy('usageCount', 'DESC')
      .limit(limit);

    if (startDate && endDate) {
      query.andWhere('mrt.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    // Gunakan Generic Type <RawTopTreatmentResult>
    const results = await query.getRawMany<RawTopTreatmentResult>();

    // Mapping manual untuk konversi string ke number yang benar
    return results.map((r) => ({
      treatmentName: r.treatmentName,
      usageCount: parseInt(r.usageCount) || 0,
      totalRevenue: parseFloat(r.totalRevenue) || 0,
    }));
  }
}
