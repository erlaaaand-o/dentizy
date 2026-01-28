import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
  Min,
  Max,
  MaxLength,
  IsBoolean,
} from 'class-validator';

import { Gender } from '../../domains/entities/patient.entity';

export enum SortField {
  NAMA_LENGKAP = 'nama_lengkap',
  NOMOR_REKAM_MEDIS = 'nomor_rekam_medis',
  TANGGAL_LAHIR = 'tanggal_lahir',
  CREATED_AT = 'created_at',
  UMUR = 'umur',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class SearchPatientDto {
  @ApiPropertyOptional({
    description: 'Pencarian by nama, NIK, email, nomor rekam medis',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Pencarian maksimal 255 karakter' })
  @Transform(({ value }: { value?: string }) => {
    if (!value) return undefined;
    return value
      .trim()
      .replace(/[<>'"]/g, '')
      .substring(0, 255);
  })
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Page harus berupa angka' })
  @Min(1, { message: 'Page minimal 1' })
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Limit harus berupa angka' })
  @Min(1, { message: 'Limit minimal 1' })
  @Max(100, { message: 'Limit maksimal 100' })
  limit?: number = 10;

  @ApiPropertyOptional({ enum: SortField })
  @IsOptional()
  @IsEnum(SortField, { message: 'Sort field tidak valid' })
  sortBy?: SortField = SortField.CREATED_AT;

  @ApiPropertyOptional({ enum: SortOrder })
  @IsOptional()
  @IsEnum(SortOrder, { message: 'Sort order harus asc atau desc' })
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender, { message: 'Jenis kelamin harus L atau P' })
  jenis_kelamin?: Gender;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Umur minimal harus berupa angka' })
  @Min(0, { message: 'Umur minimal tidak boleh negatif' })
  @Max(150, { message: 'Umur minimal maksimal 150' })
  umur_min?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Umur maksimal harus berupa angka' })
  @Min(0, { message: 'Umur maksimal tidak boleh negatif' })
  @Max(150, { message: 'Umur maksimal maksimal 150' })
  umur_max?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString({}, { message: 'Format tanggal tidak valid (YYYY-MM-DD)' })
  tanggal_daftar_dari?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString({}, { message: 'Format tanggal tidak valid (YYYY-MM-DD)' })
  tanggal_daftar_sampai?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Doctor ID maksimal 100 karakter' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  doctor_id?: string;

  @ApiPropertyOptional({ description: 'Hanya pasien aktif' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Hanya pasien baru (30 hari terakhir)' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_new?: boolean;
}
