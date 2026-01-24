// backend/src/treatment-categories/applications/mappers/treatment-category.mapper.ts
import { Injectable } from '@nestjs/common';
import { TreatmentCategory } from '../../domains/entities/treatment-categories.entity';
import { TreatmentCategoryResponseDto } from '../../applications/dto/treatment-category-response.dto';
import { CreateTreatmentCategoryDto } from '../../applications/dto/create-treatment-category.dto';

@Injectable()
export class TreatmentCategoryMapper {
  toResponseDto(entity: TreatmentCategory): TreatmentCategoryResponseDto {
    return new TreatmentCategoryResponseDto({
      id: entity.id,
      namaKategori: entity.namaKategori,
      deskripsi: entity.deskripsi,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  toEntity(dto: CreateTreatmentCategoryDto): Partial<TreatmentCategory> {
    return {
      namaKategori: dto.namaKategori,
      deskripsi: dto.deskripsi,
      isActive: dto.isActive ?? true,
    };
  }

  toResponseDtoList(
    entities: TreatmentCategory[],
  ): TreatmentCategoryResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
