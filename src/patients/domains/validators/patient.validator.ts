import { Injectable } from '@nestjs/common';
import { CreatePatientDto } from '../../application/dto/create-patient.dto';
import { UpdatePatientDto } from '../../application/dto/update-patient.dto';
import { SearchPatientDto } from '../../application/dto/search-patient.dto';
import { PatientCreateValidator } from './patient-create.validator';
import { PatientUpdateValidator } from './patient-update.validator';
import { PatientSearchValidator } from './patient-search.validator';

@Injectable()
export class PatientValidator {
  constructor(
    private readonly createValidator: PatientCreateValidator,
    private readonly updateValidator: PatientUpdateValidator,
    private readonly searchValidator: PatientSearchValidator,
  ) {}

  async validateCreate(dto: CreatePatientDto): Promise<void> {
    return this.createValidator.validate(dto);
  }

  async validateUpdate(id: string, dto: UpdatePatientDto): Promise<void> {
    return this.updateValidator.validate(id, dto);
  }

  validateSearchQuery(query: SearchPatientDto): void {
    return this.searchValidator.validate(query);
  }
}
