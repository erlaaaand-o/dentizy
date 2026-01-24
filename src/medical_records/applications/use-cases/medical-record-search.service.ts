// applications/use-cases/medical-record-search.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { MedicalRecord } from '../../domains/entities/medical-record.entity';
import { User } from '../../../users/domains/entities/user.entity';
import { SearchMedicalRecordDto } from '../dto/search-medical-record.dto';
import { MedicalRecordAuthorizationService } from '../../domains/services/medical-record-authorization.service';
import { AppointmentStatus } from '../../../appointments/domains/entities/appointment.entity';

@Injectable()
export class MedicalRecordSearchService {
  private readonly logger = new Logger(MedicalRecordSearchService.name);

  constructor(
    @InjectRepository(MedicalRecord)
    private readonly repository: Repository<MedicalRecord>,
    private readonly authService: MedicalRecordAuthorizationService,
  ) {}

  /**
   * Search medical records with filters and authorization
   */
  async execute(
    filters: SearchMedicalRecordDto,
    user: User,
  ): Promise<{
    data: MedicalRecord[];
    total: number;
    page: number;
    limit: number;
  }> {
    // Build base query
    const queryBuilder = this.buildBaseQuery();

    // Apply authorization filter
    this.applyAuthorizationFilter(queryBuilder, user);

    // Apply search filters
    this.applySearchFilters(queryBuilder, filters);

    // Apply sorting
    this.applySorting(queryBuilder, filters);

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Apply pagination
    this.applyPagination(queryBuilder, filters);

    // Execute query
    const data = await queryBuilder.getMany();

    // Log search
    this.logger.log(
      `User ${user.id} (${this.authService.getRoleSummary(user)}) ` +
        `searched medical records: found ${data.length}/${total} results`,
    );

    return {
      data,
      total,
      page: filters.page || 1,
      limit: filters.limit || 10,
    };
  }

  /**
   * Find all without filters (for backward compatibility)
   */
  async findAll(user: User): Promise<MedicalRecord[]> {
    const result = await this.execute({}, user);
    return result.data;
  }

  /**
   * Build base query with all relations
   */
  private buildBaseQuery(): SelectQueryBuilder<MedicalRecord> {
    return this.repository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.appointment', 'appointment')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .leftJoinAndSelect('appointment.doctor', 'appointmentDoctor')
      .leftJoinAndSelect('appointmentDoctor.roles', 'doctorRoles')
      .leftJoinAndSelect('record.doctor', 'doctor');
  }

  /**
   * Apply role-based authorization filter
   */
  private applyAuthorizationFilter(
    queryBuilder: SelectQueryBuilder<MedicalRecord>,
    user: User,
  ): void {
    const isKepalaKlinik = this.authService.isKepalaKlinik(user);
    const isDokter = this.authService.isDokter(user);
    const isStaf = this.authService.isStaf(user);

    if (!isKepalaKlinik) {
      if (isDokter) {
        // Doctor can see records they created OR from their appointments
        queryBuilder.andWhere(
          '(appointment.doctor_id = :doctorId OR record.doctor_id = :doctorId)',
          { doctorId: user.id },
        );
      } else if (isStaf) {
        // Staff can see all non-cancelled records
        queryBuilder.andWhere('appointment.status != :cancelled', {
          cancelled: AppointmentStatus.DIBATALKAN,
        });
      }
    }
    // Kepala Klinik: no filter (can see all)
  }

  /**
   * Apply search filters
   */
  private applySearchFilters(
    queryBuilder: SelectQueryBuilder<MedicalRecord>,
    filters: SearchMedicalRecordDto,
  ): void {
    // Filter by patient_id
    if (filters.patient_id) {
      queryBuilder.andWhere('record.patient_id = :patientId', {
        patientId: filters.patient_id,
      });
    }

    // Filter by doctor_id
    if (filters.doctor_id) {
      queryBuilder.andWhere('record.doctor_id = :doctorId', {
        doctorId: filters.doctor_id,
      });
    }

    // Filter by appointment_id
    if (filters.appointment_id) {
      queryBuilder.andWhere('record.appointment_id = :appointmentId', {
        appointmentId: filters.appointment_id,
      });
    }

    // Filter by appointment status
    if (filters.appointment_status) {
      queryBuilder.andWhere('appointment.status = :status', {
        status: filters.appointment_status,
      });
    }

    // Filter by date range
    if (filters.start_date) {
      queryBuilder.andWhere('record.created_at >= :startDate', {
        startDate: filters.start_date,
      });
    }

    if (filters.end_date) {
      queryBuilder.andWhere('record.created_at <= :endDate', {
        endDate: filters.end_date,
      });
    }

    // Search in SOAP fields
    if (filters.search) {
      queryBuilder.andWhere(
        '(record.subjektif LIKE :search OR ' +
          'record.objektif LIKE :search OR ' +
          'record.assessment LIKE :search OR ' +
          'record.plan LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }
  }

  /**
   * Apply sorting
   */
  private applySorting(
    queryBuilder: SelectQueryBuilder<MedicalRecord>,
    filters: SearchMedicalRecordDto,
  ): void {
    const sortBy = filters.sort_by || 'created_at';
    const sortOrder = filters.sort_order || 'DESC';

    // Map sort field to actual column
    const sortColumn = this.mapSortField(sortBy);

    queryBuilder.orderBy(sortColumn, sortOrder);
  }

  /**
   * Map sort field to database column
   */
  private mapSortField(field: string): string {
    const fieldMap: Record<string, string> = {
      created_at: 'record.created_at',
      updated_at: 'record.updated_at',
      appointment_date: 'appointment.appointment_date',
      patient_name: 'patient.nama_lengkap',
      doctor_name: 'doctor.name',
    };

    return fieldMap[field] || 'record.created_at';
  }

  /**
   * Apply pagination
   */
  private applyPagination(
    queryBuilder: SelectQueryBuilder<MedicalRecord>,
    filters: SearchMedicalRecordDto,
  ): void {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);
  }
}
