// backend/src/treatments/applications/dto/treatment-list-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TreatmentListResponseDto {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 'TRT-001' })
  kodePerawatan: string;

  @ApiProperty({ example: 'Pembersihan Karang Gigi' })
  namaPerawatan: string;

  @ApiProperty({ example: 250000 })
  harga: number;

  @ApiPropertyOptional({ example: 30 })
  durasiEstimasi?: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiPropertyOptional({ example: 'Perawatan Gigi' })
  categoryName?: string;
}
