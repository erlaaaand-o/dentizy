import { Injectable } from '@nestjs/common';
import { CreatePatientDto } from '../dto/create-patient.dto';
import { UpdatePatientDto } from '../dto/update-patient.dto';
import { SearchPatientDto } from '../dto/search-patient.dto';
import { PatientResponseDto } from '../dto/patient-response.dto';
import { PatientCreationService } from '../use-cases/patient-creation.service';
import { PatientFindService } from '../use-cases/patient-find.service';
import { PatientSearchService } from '../use-cases/patient-search.service';
import { PatientUpdateService } from '../use-cases/patient-update.service';
import { PatientDeletionService } from '../use-cases/patient-deletion.service';
import { PatientRestoreService } from '../use-cases/patient-restore.service';
import { PatientStatisticsService } from '../use-cases/patient-statistics.service';
import { PaginatedPatients } from '../../application/dto/patient-response.dto';

/**
 * Orchestrator Service - Mengoordinasikan use cases
 * Bertindak sebagai facade untuk semua operasi patient
 */
@Injectable()
export class PatientsService {
  constructor(
    private readonly creationService: PatientCreationService,
    private readonly findService: PatientFindService,
    private readonly searchService: PatientSearchService,
    private readonly updateService: PatientUpdateService,
    private readonly deletionService: PatientDeletionService,
    private readonly restoreService: PatientRestoreService,
    private readonly statisticsService: PatientStatisticsService,
  ) {}

  /**
   * Buat pasien baru
   */
  async create(
    createPatientDto: CreatePatientDto,
  ): Promise<PatientResponseDto> {
    return this.creationService.execute(createPatientDto);
  }

  /**
   * Ambil semua pasien dengan pagination
   */
  async findAll(query: SearchPatientDto): Promise<PaginatedPatients> {
    return this.findService.findAll(query);
  }

  /**
   * Search pasien dengan full features
   */
  async search(query: SearchPatientDto): Promise<PaginatedPatients> {
    return this.searchService.execute(query);
  }

  /**
   * Get statistics untuk dashboard
   */
  async getStatistics(): Promise<{
    total: number;
    new_this_month: number;
    active: number;
  }> {
    return this.statisticsService.execute();
  }

  /**
   * Find patient by ID
   */
  async findOne(id: string): Promise<PatientResponseDto> {
    return this.findService.findOne(id);
  }

  /**
   * Find patient by medical record number
   */
  async findByMedicalRecordNumber(
    nomorRekamMedis: string,
  ): Promise<PatientResponseDto> {
    return this.findService.findByMedicalRecordNumber(nomorRekamMedis);
  }

  /**
   * Find patient by NIK
   */
  async findByNik(nik: string): Promise<PatientResponseDto> {
    return this.findService.findByNik(nik);
  }

  /**
   * Find patients by doctor
   */
  async findByDoctor(
    doctorId: string,
    query: SearchPatientDto,
  ): Promise<PaginatedPatients> {
    return this.findService.findByDoctor(doctorId, query);
  }

  /**
   * Update patient data
   */
  async update(
    id: string,
    updatePatientDto: UpdatePatientDto,
  ): Promise<PatientResponseDto> {
    return this.updateService.execute(id, updatePatientDto);
  }

  /**
   * Soft delete patient
   */
  async remove(id: string): Promise<{ message: string }> {
    return this.deletionService.execute(id);
  }

  /**
   * Restore soft-deleted patient
   */
  async restore(id: string): Promise<{ message: string }> {
    return this.restoreService.execute(id);
  }
}
