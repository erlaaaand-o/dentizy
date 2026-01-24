// backend/src/treatment-categories/applications/dto/update-treatment-category.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateTreatmentCategoryDto } from './create-treatment-category.dto';

export class UpdateTreatmentCategoryDto extends PartialType(
  CreateTreatmentCategoryDto,
) {}
