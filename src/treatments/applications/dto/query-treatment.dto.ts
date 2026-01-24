// backend/src/treatments/applications/dto/query-treatment.dto.ts
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  Min,
  IsIn,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryTreatmentDto {
  @ApiPropertyOptional({
    description: 'Kata kunci pencarian untuk nama perawatan',
    example: 'gigi',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan ID kategori',
    example: 1,
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan status aktif',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Nomor halaman',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Jumlah data per halaman',
    example: 10,
    minimum: 1,
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Field untuk sorting',
    example: 'namaPerawatan',
    enum: ['namaPerawatan', 'harga', 'createdAt', 'kodePerawatan'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['namaPerawatan', 'harga', 'createdAt', 'kodePerawatan'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Arah sorting',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
