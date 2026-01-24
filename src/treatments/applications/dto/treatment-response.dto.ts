// backend/src/treatments/applications/dto/treatment-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CategoryInfoDto {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 'Perawatan Gigi' })
  namaKategori: string;
}

export class TreatmentResponseDto {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 1 })
  categoryId: string;

  @ApiProperty({ example: 'TRT-001' })
  kodePerawatan: string;

  @ApiProperty({ example: 'Pembersihan Karang Gigi' })
  namaPerawatan: string;

  @ApiPropertyOptional({
    example: 'Pembersihan karang gigi menggunakan ultrasonic scaler',
  })
  deskripsi?: string;

  @ApiProperty({ example: 250000 })
  harga: number;

  @ApiPropertyOptional({ example: 30 })
  durasiEstimasi?: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ type: CategoryInfoDto })
  category?: CategoryInfoDto;

  constructor(partial: Partial<TreatmentResponseDto>) {
    Object.assign(this, partial);
  }
}
