// backend/src/medical-record-treatments/interface/http/dto/query-medical-record-treatment.dto.ts
import { IsOptional, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryMedicalRecordTreatmentDto {
  @ApiPropertyOptional({
    description: 'Filter berdasarkan Medical Record ID',
    example: 1,
    type: String,
  })
  @IsOptional()
  @IsString({ message: 'Medical Record ID harus berupa UUID' })
  medicalRecordId?: string;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan Treatment ID',
    example: 1,
    type: String,
  })
  @IsOptional()
  @IsString({ message: 'Treatment ID harus berupa UUID' })
  treatmentId?: string;

  @ApiPropertyOptional({
    description: 'Nomor halaman',
    example: 1,
    minimum: 1,
    default: 1,
    type: Number,
  })
  @IsOptional()
  @IsInt({ message: 'Page harus berupa bilangan bulat' })
  @Min(1, { message: 'Page minimal 1' })
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Jumlah data per halaman',
    example: 10,
    minimum: 1,
    default: 10,
    type: Number,
  })
  @IsOptional()
  @IsInt({ message: 'Limit harus berupa bilangan bulat' })
  @Min(1, { message: 'Limit minimal 1' })
  @Type(() => Number)
  limit?: number = 10;
}
