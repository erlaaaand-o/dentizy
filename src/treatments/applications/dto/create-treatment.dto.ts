// backend/src/treatments/applications/dto/create-treatment.dto.ts
import {
  IsString,
  IsInt,
  IsOptional,
  IsBoolean,
  IsNumber,
  MaxLength,
  Min,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateTreatmentDto {
  @ApiProperty({
    description: 'ID kategori perawatan',
    example: 1,
    type: String,
  })
  @IsUUID()
  categoryId: string;

  @ApiProperty({
    description: 'Nama perawatan',
    example: 'Pembersihan Karang Gigi',
    maxLength: 250,
  })
  @IsString({ message: 'Nama perawatan harus berupa string' })
  @MaxLength(250, { message: 'Nama perawatan maksimal 250 karakter' })
  namaPerawatan: string;

  @ApiPropertyOptional({
    description: 'Deskripsi detail perawatan',
    example: 'Pembersihan karang gigi menggunakan alat ultrasonic scaler',
  })
  @IsOptional()
  @IsString({ message: 'Deskripsi harus berupa string' })
  deskripsi?: string;

  @ApiProperty({
    description: 'Harga perawatan dalam rupiah',
    example: 250000,
    minimum: 0,
  })
  @IsNumber({}, { message: 'Harga harus berupa angka' })
  @Min(0, { message: 'Harga tidak boleh negatif' })
  @Type(() => Number)
  harga: number;

  @ApiPropertyOptional({
    description: 'Estimasi durasi perawatan dalam menit',
    example: 30,
    minimum: 0,
  })
  @IsOptional()
  @IsInt({ message: 'Durasi estimasi harus berupa angka' })
  @Min(0, { message: 'Durasi tidak boleh negatif' })
  @Type(() => Number)
  durasiEstimasi?: number;

  @ApiPropertyOptional({
    description: 'Status aktif perawatan',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Status aktif harus berupa boolean' })
  isActive?: boolean;
}
