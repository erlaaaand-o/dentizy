import { Injectable } from '@nestjs/common';
import { SelectQueryBuilder, Brackets } from 'typeorm';

import {
  SearchPatientDto,
  SortField,
  SortOrder,
} from '../../../application/dto/search-patient.dto';
import { Patient } from '../../../domains/entities/patient.entity';

@Injectable()
export class PatientQueryBuilder {
  /**
   * Build comprehensive search query dengan optimizations
   */
  build(
    queryBuilder: SelectQueryBuilder<Patient>,
    query: SearchPatientDto,
  ): SelectQueryBuilder<Patient> {
    // Apply filters
    this.applySearchFilter(queryBuilder, query.search);
    this.applyGenderFilter(queryBuilder, query.jenis_kelamin);
    this.applyAgeFilter(queryBuilder, query.umur_min, query.umur_max);
    this.applyDateRangeFilter(
      queryBuilder,
      query.tanggal_daftar_dari,
      query.tanggal_daftar_sampai,
    );
    this.applyDoctorFilter(queryBuilder, query.doctor_id);
    this.applyStatusFilters(queryBuilder, query);

    // Apply sorting
    this.applySorting(queryBuilder, query.sortBy, query.sortOrder);

    return queryBuilder;
  }

  /**
   * Multi-field search dengan OR conditions
   * Supports: nama, NIK, nomor rekam medis, email, no HP
   */
  private applySearchFilter(
    qb: SelectQueryBuilder<Patient>,
    search?: string,
  ): void {
    if (!search || search.trim().length < 2) return;

    const searchTerm = `%${search.trim()}%`;

    qb.andWhere(
      new Brackets((subQb) => {
        subQb
          .where('patient.nama_lengkap LIKE :search', { search: searchTerm })
          .orWhere('patient.nik LIKE :search', { search: searchTerm })
          .orWhere('patient.nomor_rekam_medis LIKE :search', {
            search: searchTerm,
          })
          .orWhere('patient.email LIKE :search', { search: searchTerm })
          .orWhere('patient.no_hp LIKE :search', { search: searchTerm });
      }),
    );

    // Use fulltext index if available and search term is single word
    if (search.split(' ').length === 1 && search.length >= 3) {
      // MySQL FULLTEXT search for better performance on large datasets
      // qb.orWhere('MATCH(patient.nama_lengkap) AGAINST (:searchFulltext IN BOOLEAN MODE)', {
      //     searchFulltext: `${search}*`,
      // });
    }
  }

  /**
   * Filter by gender
   */
  private applyGenderFilter(
    qb: SelectQueryBuilder<Patient>,
    gender?: string,
  ): void {
    if (gender) {
      qb.andWhere('patient.jenis_kelamin = :jenis_kelamin', {
        jenis_kelamin: gender,
      });
    }
  }

  /**
   * Filter by age range
   * Converts age to birth date range for efficient querying
   */
  private applyAgeFilter(
    qb: SelectQueryBuilder<Patient>,
    minAge?: number,
    maxAge?: number,
  ): void {
    if (maxAge !== undefined) {
      const maxBirthDate = this.calculateBirthDateFromAge(maxAge);
      qb.andWhere('patient.tanggal_lahir >= :maxBirthDate', {
        maxBirthDate: maxBirthDate.toISOString().split('T')[0],
      });
    }

    if (minAge !== undefined) {
      const minBirthDate = this.calculateBirthDateFromAge(minAge);
      qb.andWhere('patient.tanggal_lahir <= :minBirthDate', {
        minBirthDate: minBirthDate.toISOString().split('T')[0],
      });
    }
  }

  /**
   * Filter by registration date range
   */
  private applyDateRangeFilter(
    qb: SelectQueryBuilder<Patient>,
    dateFrom?: string,
    dateTo?: string,
  ): void {
    if (dateFrom) {
      qb.andWhere('DATE(patient.created_at) >= :dateFrom', { dateFrom });
    }
    if (dateTo) {
      qb.andWhere('DATE(patient.created_at) <= :dateTo', { dateTo });
    }
  }

  /**
   * Filter patients by doctor (via appointments)
   */
  private applyDoctorFilter(
    qb: SelectQueryBuilder<Patient>,
    doctorId?: string,
  ): void {
    if (doctorId) {
      qb.leftJoin('patient.appointments', 'appointment')
        .andWhere('appointment.doctor_id = :doctor_id', { doctor_id: doctorId })
        .distinct(true);
    }
  }

  /**
   * Apply status filters (active, new, has allergies)
   */
  private applyStatusFilters(
    qb: SelectQueryBuilder<Patient>,
    query: SearchPatientDto,
  ): void {
    // Filter active patients
    if (query.is_active !== undefined) {
      qb.andWhere('patient.is_active = :is_active', {
        is_active: query.is_active,
      });
    }

    // Filter new patients (last 30 days)
    if (query.is_new) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      qb.andWhere('patient.created_at >= :thirtyDaysAgo', { thirtyDaysAgo });
    }
  }

  /**
   * Apply sorting dengan support multiple fields
   */
  private applySorting(
    qb: SelectQueryBuilder<Patient>,
    sortBy?: SortField,
    sortOrder?: SortOrder,
  ): void {
    const field = sortBy || SortField.CREATED_AT;
    const order = (sortOrder || SortOrder.DESC).toUpperCase() as 'ASC' | 'DESC';

    // Special handling untuk sorting by umur (computed field)
    if (field === SortField.UMUR) {
      // Sort by tanggal_lahir DESC untuk umur ASC
      qb.orderBy('patient.tanggal_lahir', order === 'ASC' ? 'DESC' : 'ASC');
    } else {
      qb.orderBy(`patient.${field}`, order);
    }

    // Secondary sort by ID for consistent pagination
    qb.addOrderBy('patient.id', 'DESC');
  }

  /**
   * Calculate birth date from age
   */
  private calculateBirthDateFromAge(age: number): Date {
    const today = new Date();
    const birthYear = today.getFullYear() - age;
    return new Date(birthYear, today.getMonth(), today.getDate());
  }

  /**
   * Add eager loading untuk relasi yang sering diakses
   */
  addEagerRelations(
    qb: SelectQueryBuilder<Patient>,
  ): SelectQueryBuilder<Patient> {
    return qb
      .leftJoinAndSelect('patient.appointments', 'appointment')
      .leftJoinAndSelect('patient.medical_records', 'medical_record')
      .where('appointment.status != :cancelled', { cancelled: 'dibatalkan' });
  }

  /**
   * Apply search hints untuk MySQL query optimization
   */
  addQueryHints(qb: SelectQueryBuilder<Patient>): SelectQueryBuilder<Patient> {
    // MySQL specific optimization hints
    // qb.setQueryRunner().setUseIndexHints(['idx_patient_search']);
    return qb;
  }
}
