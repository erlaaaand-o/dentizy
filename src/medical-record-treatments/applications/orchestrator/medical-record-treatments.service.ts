// backend/src/medical-record-treatments/applications/orchestrator/medical-record-treatments.service.ts
import { Injectable } from '@nestjs/common';
import { CreateMedicalRecordTreatmentUseCase } from '../use-cases/create-medical-record-treatment.use-case';
import { UpdateMedicalRecordTreatmentUseCase } from '../use-cases/update-medical-record-treatment.use-case';
import { DeleteMedicalRecordTreatmentUseCase } from '../use-cases/delete-medical-record-treatment.use-case';
import { FindAllMedicalRecordTreatmentsUseCase } from '../use-cases/find-all-medical-record-treatments.use-case';
import { FindOneMedicalRecordTreatmentUseCase } from '../use-cases/find-one-medical-record-treatment.use-case';
import { FindByMedicalRecordIdUseCase } from '../use-cases/find-by-medical-record-id.use-case';
import { GetTotalByMedicalRecordIdUseCase } from '../use-cases/get-total-by-medical-record-id.use-case';
import { CreateMedicalRecordTreatmentDto } from '../dto/create-medical-record-treatment.dto';
import { UpdateMedicalRecordTreatmentDto } from '../dto/update-medical-record-treatment.dto';
import { QueryMedicalRecordTreatmentDto } from '../dto/query-medical-record-treatment.dto';
import { MedicalRecordTreatmentResponseDto } from '../dto/medical-record-treatment-response.dto';
import {
  MedicalRecordTreatmentRepository,
  TopTreatmentStatistics,
} from '../../../medical-record-treatments/infrastructures/persistence/repositories/medical-record-treatment.repository';

@Injectable()
export class MedicalRecordTreatmentsService {
  constructor(
    private readonly createUseCase: CreateMedicalRecordTreatmentUseCase,
    private readonly updateUseCase: UpdateMedicalRecordTreatmentUseCase,
    private readonly deleteUseCase: DeleteMedicalRecordTreatmentUseCase,
    private readonly findAllUseCase: FindAllMedicalRecordTreatmentsUseCase,
    private readonly findOneUseCase: FindOneMedicalRecordTreatmentUseCase,
    private readonly findByMedicalRecordIdUseCase: FindByMedicalRecordIdUseCase,
    private readonly getTotalUseCase: GetTotalByMedicalRecordIdUseCase,
    private readonly repository: MedicalRecordTreatmentRepository,
  ) {}

  async create(
    dto: CreateMedicalRecordTreatmentDto,
  ): Promise<MedicalRecordTreatmentResponseDto> {
    return await this.createUseCase.execute(dto);
  }

  async findAll(query: QueryMedicalRecordTreatmentDto) {
    return await this.findAllUseCase.execute(query);
  }

  async findOne(id: string): Promise<MedicalRecordTreatmentResponseDto> {
    return await this.findOneUseCase.execute(id);
  }

  async findByMedicalRecordId(
    medicalRecordId: string,
  ): Promise<MedicalRecordTreatmentResponseDto[]> {
    return await this.findByMedicalRecordIdUseCase.execute(medicalRecordId);
  }

  async update(
    id: string,
    dto: UpdateMedicalRecordTreatmentDto,
  ): Promise<MedicalRecordTreatmentResponseDto> {
    return await this.updateUseCase.execute(id, dto);
  }

  async remove(id: string): Promise<void> {
    return await this.deleteUseCase.execute(id);
  }

  async getTotalByMedicalRecordId(medicalRecordId: string): Promise<number> {
    return await this.getTotalUseCase.execute(medicalRecordId);
  }

  async getTopTreatments(
    limit: number = 10,
    startDate?: Date,
    endDate?: Date,
  ): Promise<TopTreatmentStatistics[]> {
    return await this.repository.getTopTreatments(limit, startDate, endDate);
  }
}
