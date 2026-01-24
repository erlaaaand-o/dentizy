import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  FingerPosition,
  FingerprintQuality,
} from '../../domains/entities/fingerprint.entity';

export class SearchFingerprintDto {
  @ApiPropertyOptional({
    description: 'ID Pasien',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  patient_id?: number;

  @ApiPropertyOptional({
    description: 'Posisi jari',
    enum: FingerPosition,
  })
  @IsOptional()
  @IsEnum(FingerPosition)
  finger_position?: FingerPosition;

  @ApiPropertyOptional({
    description: 'Kualitas template',
    enum: FingerprintQuality,
  })
  @IsOptional()
  @IsEnum(FingerprintQuality)
  quality?: FingerprintQuality;

  @ApiPropertyOptional({
    description: 'Hanya sidik jari aktif',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'ID perangkat',
    example: 'ZKTECO-001',
  })
  @IsOptional()
  device_id?: string;

  @ApiPropertyOptional({
    description: 'Tanggal mulai pendaftaran',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  created_from?: string;

  @ApiPropertyOptional({
    description: 'Tanggal akhir pendaftaran',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  created_to?: string;

  @ApiPropertyOptional({
    description: 'Minimal jumlah verifikasi',
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  min_verification_count?: number;

  @ApiPropertyOptional({
    description: 'Halaman',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Jumlah data per halaman',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;
}
