// applications/orchestrator/medical_records.service.ts
import { Injectable } from '@nestjs/common';
import { CreateMedicalRecordDto } from '../dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from '../dto/update-medical-record.dto';
import { SearchMedicalRecordDto } from '../dto/search-medical-record.dto';
import { MedicalRecordResponseDto } from '../dto/medical-record-response.dto';
import { User } from '../../../users/domains/entities/user.entity';
import { MedicalRecordMapper } from '../../domains/mappers/medical-record.mappers';
import { MedicalRecordCreationService } from '../use-cases/medical-record-creation.service';
import { MedicalRecordUpdateService } from '../use-cases/medical-record-update.service';
import { MedicalRecordFindService } from '../use-cases/medical-record-find.service';
import { MedicalRecordSearchService } from '../use-cases/medical-record-search.service';
import { MedicalRecordAppointmentFinderService } from '../use-cases/medical-record-appointment-finder.service';
import { MedicalRecordDeletionService } from '../use-cases/medical-record-deletion.service';
import { FindAllMedicalRecordQueryDto } from '../dto/find-all-medical-record.dto';
import { MedicalRecordQueryBuilder } from '../../infrastructure/persistence/query/medical-record-query.builder';
import { MedicalRecordsRepository } from '../../../medical_records/infrastructure/persistence/repositories/medical-records.repository';
import { DoctorPerformance } from '../../infrastructure/persistence/repositories/medical-records.repository';

/**
 * Orchestrator Service
 * Coordinates between use cases and maps results to DTOs
 */
@Injectable()
export class MedicalRecordsService {
  constructor(
    private readonly mapper: MedicalRecordMapper,
    private readonly creationService: MedicalRecordCreationService,
    private readonly updateService: MedicalRecordUpdateService,
    private readonly findService: MedicalRecordFindService,
    private readonly searchService: MedicalRecordSearchService,
    private readonly appointmentFinderService: MedicalRecordAppointmentFinderService,
    private readonly deletionService: MedicalRecordDeletionService,
    private readonly queryBuilder: MedicalRecordQueryBuilder,
    private readonly repository: MedicalRecordsRepository,
  ) {}

  /**
   * Create new medical record
   */
  async create(
    createDto: CreateMedicalRecordDto,
    user: User,
  ): Promise<MedicalRecordResponseDto> {
    const entity = await this.creationService.execute(createDto, user);
    return this.mapper.toResponseDto(entity);
  }

  /**
   * Find all medical records with authorization
   */
  async findAll(user: User, query: FindAllMedicalRecordQueryDto) {
    const qb = this.queryBuilder.buildFindAllQuery(user, query);

    const [records, total] = await qb.getManyAndCount();

    return {
      data: this.mapper.toResponseDtoArray(records),
      total,
      page: query.page ?? 1,
      limit: query.limit ?? 10,
    };
  }

  /**
   * Search medical records with filters
   */
  async search(
    filters: SearchMedicalRecordDto,
    user: User,
  ): Promise<{
    data: MedicalRecordResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const result = await this.searchService.execute(filters, user);

    return {
      data: this.mapper.toResponseDtoArray(result.data),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  /**
   * Find medical record by ID
   */
  async findOne(id: string, user: User): Promise<MedicalRecordResponseDto> {
    const entity = await this.findService.execute(id, user);
    return this.mapper.toResponseDto(entity);
  }

  /**
   * Find medical record by appointment ID
   */
  async findByAppointmentId(
    appointmentId: string,
    user: User,
  ): Promise<MedicalRecordResponseDto | null> {
    const entity = await this.appointmentFinderService.execute(
      appointmentId,
      user,
    );

    if (!entity) {
      return null;
    }

    return this.mapper.toResponseDto(entity);
  }

  /**
   * Update medical record
   */
  async update(
    id: string,
    updateDto: UpdateMedicalRecordDto,
    user: User,
  ): Promise<MedicalRecordResponseDto> {
    const entity = await this.updateService.execute(id, updateDto, user);
    return this.mapper.toResponseDto(entity);
  }

  /**
   * Delete medical record (soft delete)
   */
  async remove(id: string, user: User): Promise<void> {
    await this.deletionService.execute(id, user);
  }

  /**
   * Hard delete medical record (permanent)
   */
  async hardDelete(id: string, user: User): Promise<void> {
    await this.deletionService.hardDelete(id, user);
  }

  /**
   * Restore soft-deleted medical record
   */
  async restore(id: string, user: User): Promise<MedicalRecordResponseDto> {
    const entity = await this.deletionService.restore(id, user);
    return this.mapper.toResponseDto(entity);
  }

  /**
   * Check if medical record exists for appointment
   */
  async existsForAppointment(appointmentId: string): Promise<boolean> {
    return await this.appointmentFinderService.exists(appointmentId);
  }

  /**
   * Get doctor statistics
   */
  async getDoctorStatistics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<DoctorPerformance[]> {
    return await this.repository.getDoctorPerformance(startDate, endDate);
  }
}
