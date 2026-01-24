import { Injectable } from '@nestjs/common';
import { SelectQueryBuilder, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MedicalRecord } from './../../../domains/entities/medical-record.entity';
import { User } from '../../../../users/domains/entities/user.entity';
import { UserRole } from '../../../../roles/entities/role.entity';
import { AppointmentStatus } from '../../../../appointments/domains/entities/appointment.entity';

/**
 * Query Builder for Medical Records
 * Provides reusable query building blocks
 */
@Injectable()
export class MedicalRecordQueryBuilder {
  constructor(
    @InjectRepository(MedicalRecord)
    private readonly repository: Repository<MedicalRecord>,
  ) {}

  /**
   * Create base query with standard relations
   */
  createBaseQuery(): SelectQueryBuilder<MedicalRecord> {
    return (
      this.repository
        .createQueryBuilder('record')

        // 1. Join ke Appointment (Info Jadwal)
        .leftJoinAndSelect('record.appointment', 'appointment')

        // [PERBAIKAN 1] Join ke Patient LANGSUNG dari Record
        // Agar data nama pasien & No RM muncul di tabel
        .leftJoinAndSelect('record.patient', 'patient')

        // Join ke Dokter (Info Dokter Pemeriksa)
        .leftJoinAndSelect('record.doctor', 'doctor')

        // [PERBAIKAN 2] Join ke Tabel Pivot (Medical Record Treatments)
        // Tanpa ini, rincian biaya & tindakan akan KOSONG!
        .leftJoinAndSelect(
          'record.medicalRecordTreatments',
          'medicalRecordTreatments',
        )

        // [PERBAIKAN 3] Join ke Tabel Master Treatment
        // Untuk mengambil nama tindakan ('namaPerawatan') dan harga ('harga')
        .leftJoinAndSelect('medicalRecordTreatments.treatment', 'treatment')

        // Optional: Info detail dokter dari appointment (jika perlu role/user details)
        .leftJoinAndSelect('appointment.doctor', 'appointmentDoctor')
        .leftJoinAndSelect('appointmentDoctor.roles', 'doctorRoles')
    );
  }

  /**
   * Add authorization filter based on user role
   */
  applyAuthorizationFilter(
    query: SelectQueryBuilder<MedicalRecord>,
    user: User,
  ): SelectQueryBuilder<MedicalRecord> {
    const roles = user.roles.map((r) => r.name);

    // Kepala Klinik: no filter
    if (roles.includes(UserRole.KEPALA_KLINIK)) {
      return query;
    }

    // Dokter: only their records
    if (roles.includes(UserRole.DOKTER)) {
      query.andWhere(
        '(appointment.doctor_id = :userId OR record.doctor_id = :userId)',
        { userId: user.id },
      );
    }
    // Staf: all non-cancelled
    else if (roles.includes(UserRole.STAF)) {
      query.andWhere('appointment.status != :cancelled', {
        cancelled: AppointmentStatus.DIBATALKAN,
      });
    }
    // Unknown role: deny all
    else {
      query.andWhere('1 = 0');
    }

    return query;
  }

  /**
   * Filter by patient ID
   */
  filterByPatient(
    query: SelectQueryBuilder<MedicalRecord>,
    patientId: string,
  ): SelectQueryBuilder<MedicalRecord> {
    return query.andWhere('record.patient_id = :patientId', { patientId });
  }

  /**
   * Filter by doctor ID
   */
  filterByDoctor(
    query: SelectQueryBuilder<MedicalRecord>,
    doctorId: string,
  ): SelectQueryBuilder<MedicalRecord> {
    return query.andWhere('record.doctor_id = :doctorId', { doctorId });
  }

  /**
   * Filter by appointment ID
   */
  filterByAppointment(
    query: SelectQueryBuilder<MedicalRecord>,
    appointmentId: string,
  ): SelectQueryBuilder<MedicalRecord> {
    return query.andWhere('record.appointment_id = :appointmentId', {
      appointmentId,
    });
  }

  /**
   * Filter by date range
   */
  filterByDateRange(
    query: SelectQueryBuilder<MedicalRecord>,
    startDate?: Date,
    endDate?: Date,
  ): SelectQueryBuilder<MedicalRecord> {
    if (startDate) {
      query.andWhere('record.created_at >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('record.created_at <= :endDate', { endDate });
    }

    return query;
  }

  /**
   * Filter by appointment status
   */
  filterByAppointmentStatus(
    query: SelectQueryBuilder<MedicalRecord>,
    status: AppointmentStatus,
  ): SelectQueryBuilder<MedicalRecord> {
    return query.andWhere('appointment.status = :status', { status });
  }

  /**
   * Search in SOAP fields
   */
  searchInSOAPFields(
    query: SelectQueryBuilder<MedicalRecord>,
    searchTerm: string,
  ): SelectQueryBuilder<MedicalRecord> {
    return query.andWhere(
      '(record.subjektif LIKE :search OR ' +
        'record.objektif LIKE :search OR ' +
        'record.assessment LIKE :search OR ' +
        'record.plan LIKE :search)',
      { search: `%${searchTerm}%` },
    );
  }

  /**
   * Filter incomplete records (missing SOAP fields)
   */
  filterIncomplete(
    query: SelectQueryBuilder<MedicalRecord>,
  ): SelectQueryBuilder<MedicalRecord> {
    return query.andWhere(
      '(record.subjektif IS NULL OR record.subjektif = "" OR ' +
        'record.objektif IS NULL OR record.objektif = "" OR ' +
        'record.assessment IS NULL OR record.assessment = "" OR ' +
        'record.plan IS NULL OR record.plan = "")',
    );
  }

  /**
   * Filter complete records (all SOAP fields filled)
   */
  filterComplete(
    query: SelectQueryBuilder<MedicalRecord>,
  ): SelectQueryBuilder<MedicalRecord> {
    return query.andWhere(
      'record.subjektif IS NOT NULL AND record.subjektif != "" AND ' +
        'record.objektif IS NOT NULL AND record.objektif != "" AND ' +
        'record.assessment IS NOT NULL AND record.assessment != "" AND ' +
        'record.plan IS NOT NULL AND record.plan != ""',
    );
  }

  /**
   * Add pagination
   */
  paginate(
    query: SelectQueryBuilder<MedicalRecord>,
    page: number = 1,
    limit: number = 10,
  ): SelectQueryBuilder<MedicalRecord> {
    const skip = (page - 1) * limit;
    return query.skip(skip).take(limit);
  }

  /**
   * Add sorting
   */
  sortBy(
    query: SelectQueryBuilder<MedicalRecord>,
    field: string = 'created_at',
    order: 'ASC' | 'DESC' = 'DESC',
  ): SelectQueryBuilder<MedicalRecord> {
    const sortMap: Record<string, string> = {
      created_at: 'record.created_at',
      updated_at: 'record.updated_at',
      appointment_date: 'appointment.appointment_date',
      patient_name: 'patient.nama_lengkap',
      doctor_name: 'doctor.name',
    };

    const sortField = sortMap[field] || 'record.created_at';
    return query.orderBy(sortField, order);
  }

  /**
   * Include soft-deleted records
   */
  withDeleted(
    query: SelectQueryBuilder<MedicalRecord>,
  ): SelectQueryBuilder<MedicalRecord> {
    return query.withDeleted();
  }

  /**
   * Only soft-deleted records
   */
  onlyDeleted(
    query: SelectQueryBuilder<MedicalRecord>,
  ): SelectQueryBuilder<MedicalRecord> {
    return query.withDeleted().andWhere('record.deleted_at IS NOT NULL');
  }

  /**
   * Build complete query for findAll with filters
   */
  buildFindAllQuery(
    user: User,
    filters?: {
      patientId?: string;
      doctorId?: string;
      appointmentId?: string;
      search?: string;
      startDate?: Date;
      endDate?: Date;
      status?: AppointmentStatus;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    },
  ): SelectQueryBuilder<MedicalRecord> {
    let query = this.createBaseQuery();

    // Apply authorization
    query = this.applyAuthorizationFilter(query, user);

    // Apply filters if provided
    if (filters) {
      if (filters.patientId) {
        query = this.filterByPatient(query, filters.patientId);
      }

      if (filters.doctorId) {
        query = this.filterByDoctor(query, filters.doctorId);
      }

      if (filters.appointmentId) {
        query = this.filterByAppointment(query, filters.appointmentId);
      }

      if (filters.search) {
        query = this.searchInSOAPFields(query, filters.search);
      }

      if (filters.startDate || filters.endDate) {
        query = this.filterByDateRange(
          query,
          filters.startDate,
          filters.endDate,
        );
      }

      if (filters.status) {
        query = this.filterByAppointmentStatus(query, filters.status);
      }

      // Sorting
      query = this.sortBy(query, filters.sortBy, filters.sortOrder);

      // Pagination
      if (filters.page && filters.limit) {
        query = this.paginate(query, filters.page, filters.limit);
      }
    } else {
      // Default sorting
      query = this.sortBy(query);
    }

    return query;
  }
}
