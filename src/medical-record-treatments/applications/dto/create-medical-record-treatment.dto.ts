// backend/src/medical-record-treatments/interface/http/dto/create-medical-record-treatment.dto.ts
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateMedicalRecordTreatmentDto {
  @ApiProperty({
    description: 'ID Rekam Medis',
    example: 1,
    type: String,
  })
  @IsString({ message: 'Medical Record ID harus berupa UUID' })
  medicalRecordId: string;

  @ApiProperty({
    description: 'ID Perawatan',
    example: 1,
    type: String,
  })
  @IsInt({ message: 'Treatment ID harus berupa UUID' })
  treatmentId: string;

  @ApiProperty({
    description: 'Jumlah perawatan',
    example: 1,
    minimum: 1,
    type: Number,
  })
  @IsInt({ message: 'Jumlah harus berupa bilangan bulat' })
  @Min(1, { message: 'Jumlah minimal 1' })
  @Type(() => Number)
  jumlah: number;

  @ApiProperty({
    description: 'Harga satuan perawatan',
    example: 100000,
    minimum: 0,
    type: Number,
  })
  @IsNumber({}, { message: 'Harga satuan harus berupa angka' })
  @Min(0, { message: 'Harga satuan tidak boleh negatif' })
  @Type(() => Number)
  hargaSatuan: number;

  @ApiPropertyOptional({
    description: 'Diskon untuk perawatan',
    example: 10000,
    minimum: 0,
    type: Number,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Diskon harus berupa angka' })
  @Min(0, { message: 'Diskon tidak boleh negatif' })
  @Type(() => Number)
  diskon?: number;

  @ApiPropertyOptional({
    description: 'Keterangan tambahan',
    example: 'Perawatan rutin',
    type: String,
  })
  @IsOptional()
  @IsString({ message: 'Keterangan harus berupa string' })
  keterangan?: string;
}
