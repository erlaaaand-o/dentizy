// backend/src/medical-record-treatments/interface/http/dto/update-medical-record-treatment.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateMedicalRecordTreatmentDto } from './create-medical-record-treatment.dto';

export class UpdateMedicalRecordTreatmentDto extends PartialType(
  CreateMedicalRecordTreatmentDto,
) {}
