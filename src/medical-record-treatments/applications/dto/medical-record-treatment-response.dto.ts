// backend/src/medical-record-treatments/interface/http/dto/medical-record-treatment-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString } from 'class-validator';

class TreatmentDetailDto {
  @ApiProperty({ example: 1 })
  @IsString()
  id: string;

  @ApiProperty({ example: 'PRW001' })
  kodePerawatan: string;

  @ApiProperty({ example: 'Pemeriksaan Umum' })
  namaPerawatan: string;

  @ApiProperty({ example: 100000 })
  harga: number;
}

export class MedicalRecordTreatmentResponseDto {
  @ApiProperty({ example: 1, description: 'ID Medical Record Treatment' })
  id: string;

  @ApiProperty({ example: 1, description: 'ID Rekam Medis' })
  medicalRecordId: string;

  @ApiProperty({ example: 1, description: 'ID Perawatan' })
  treatmentId: string;

  @ApiProperty({ example: 2, description: 'Jumlah perawatan' })
  jumlah: number;

  @ApiProperty({ example: 100000, description: 'Harga satuan' })
  hargaSatuan: number;

  @ApiProperty({
    example: 200000,
    description: 'Subtotal (jumlah x harga satuan)',
  })
  subtotal: number;

  @ApiProperty({ example: 20000, description: 'Diskon' })
  diskon: number;

  @ApiProperty({ example: 180000, description: 'Total (subtotal - diskon)' })
  total: number;

  @ApiPropertyOptional({
    example: 'Perawatan rutin',
    description: 'Keterangan',
  })
  keterangan?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ type: TreatmentDetailDto })
  treatment?: TreatmentDetailDto;

  constructor(partial: Partial<MedicalRecordTreatmentResponseDto>) {
    Object.assign(this, partial);
  }
}
