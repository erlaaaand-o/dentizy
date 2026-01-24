// backend/src/treatments/domains/mappers/treatment-category.mapper.ts
import { Injectable } from '@nestjs/common';
import { TreatmentCategory } from '../../../treatment-categories/domains/entities/treatment-categories.entity';

export interface TreatmentCategoryDto {
  id: string;
  namaKategori: string;
  kodeKategori?: string;
}

@Injectable()
export class TreatmentCategoryMapper {
  toDto(category: TreatmentCategory): TreatmentCategoryDto {
    return {
      id: category.id,
      namaKategori: category.namaKategori,
    };
  }
}
