import { Injectable } from '@nestjs/common';
import {
  DataSource,
  Repository,
  SelectQueryBuilder,
  MoreThanOrEqual,
  IsNull,
} from 'typeorm';
import { Patient } from '../../../domains/entities/patient.entity';
import { SearchPatientDto } from '../../../application/dto/search-patient.dto';

@Injectable()
export class PatientRepository extends Repository<Patient> {
  constructor(private dataSource: DataSource) {
    super(Patient, dataSource.createEntityManager());
  }

  /**
   * Build optimized search query dengan eager loading
   */
  createSearchQuery(dto: SearchPatientDto): SelectQueryBuilder<Patient> {
    const qb = this.createQueryBuilder('patient').select([
      'patient.id',
      'patient.nomor_rekam_medis',
      'patient.nik',
      'patient.nama_lengkap',
      'patient.tanggal_lahir',
      'patient.alamat',
      'patient.email',
      'patient.no_hp',
      'patient.jenis_kelamin',
      'patient.is_registered_online',
      'patient.is_active',
      'patient.created_at',
      'patient.updated_at',
    ]);

    // Default: only active patients if not specified
    if (dto.is_active !== false) {
      qb.andWhere('patient.is_active = :is_active', { is_active: true });
    }

    return qb;
  }

  /**
   * Optimized search by medical record number with caching hint
   */
  async findByMedicalRecordNumber(number: string): Promise<Patient | null> {
    return this.createQueryBuilder('patient')
      .where('patient.nomor_rekam_medis = :number', { number })
      .cache(`patient_mrn_${number}`, 60000) // Cache 1 menit
      .getOne();
  }

  /**
   * Optimized search by NIK with caching
   */
  async findByNik(nik: string): Promise<Patient | null> {
    return this.createQueryBuilder('patient')
      .where('patient.nik = :nik', { nik })
      .cache(`patient_nik_${nik}`, 60000)
      .getOne();
  }

  /**
   * Find patients with upcoming appointments (untuk reminder)
   */
  async findWithUpcomingAppointments(days: number = 7): Promise<Patient[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.createQueryBuilder('patient')
      .innerJoinAndSelect('patient.appointments', 'appointment')
      .where('appointment.tanggal BETWEEN :now AND :future', {
        now: new Date(),
        future: futureDate,
      })
      .andWhere('appointment.status = :status', { status: 'dijadwalkan' })
      .orderBy('appointment.tanggal', 'ASC')
      .getMany();
  }

  /**
   * Get patients by doctor with pagination
   */
  async findByDoctorId(
    doctorId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<[Patient[], number]> {
    const qb = this.createQueryBuilder('patient')
      .innerJoin('patient.appointments', 'appointment')
      .where('appointment.doctor_id = :doctorId', { doctorId })
      .distinct(true)
      .orderBy('patient.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    return qb.getManyAndCount();
  }

  /**
   * Get statistics untuk dashboard
   */
  async getStatistics(): Promise<{
    total: number;
    new_this_month: number;
    active: number;
  }> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [total, newThisMonth, active] = await Promise.all([
      this.count(), // total semua pasien termasuk yang non-active
      this.count({
        where: {
          created_at: MoreThanOrEqual(startOfMonth),
        },
      }),
      this.count({
        where: {
          is_active: true,
          deleted_at: IsNull(), // pastikan tidak soft-delete
        },
      }),
    ]);

    return {
      total,
      new_this_month: newThisMonth,
      active,
    };
  }

  /**
   * Soft delete patient (lebih aman dari hard delete)
   */
  async findSoftDeletedById(id: string): Promise<Patient | null> {
    return this.findOne({
      where: { id },
      withDeleted: true,
    });
  }

  /**
   * Restore soft-deleted patient
   */
  async restoreById(id: string): Promise<void> {
    await this.createQueryBuilder()
      .restore()
      .where('id = :id', { id })
      .execute();
  }

  /**
   * Check if patient exists by unique field
   */
  async existsByField<K extends keyof Patient>(
    field: K,
    value: Patient[K],
  ): Promise<boolean> {
    const count = await this.createQueryBuilder('patient')
      .where(`patient.${field as string} = :value`, { value })
      .getCount();
    return count > 0;
  }

  /**
   * Bulk update patient status
   */
  async bulkUpdateStatus(ids: string[], isActive: boolean): Promise<void> {
    if (!ids || ids.length === 0) {
      return;
    }

    await this.createQueryBuilder()
      .update(Patient)
      .set({ is_active: isActive })
      .where('id IN (:...ids)', { ids })
      .execute();
  }
}
