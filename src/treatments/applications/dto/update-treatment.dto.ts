// backend/src/treatments/applications/dto/update-treatment.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateTreatmentDto } from './create-treatment.dto';

export class UpdateTreatmentDto extends PartialType(CreateTreatmentDto) {}
