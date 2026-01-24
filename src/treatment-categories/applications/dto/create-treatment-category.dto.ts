// backend/src/treatment-categories/applications/dto/create-treatment-category.dto.ts
import {
  IsString,
  IsOptional,
  IsBoolean,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTreatmentCategoryDto {
  @ApiProperty({
    description: 'Nama kategori perawatan',
    example: 'Perawatan Wajah',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  namaKategori: string;

  @ApiPropertyOptional({
    description: 'Deskripsi kategori perawatan',
    example: 'Kategori untuk berbagai jenis perawatan wajah',
  })
  @IsOptional()
  @IsString()
  deskripsi?: string;

  @ApiPropertyOptional({
    description: 'Status aktif kategori',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
