//backend/src/treatment-categories/applications/dto/treatment-category-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class TreatmentCategoryResponseDto {
  @ApiProperty({ example: 1, description: 'ID kategori' })
  id: string;

  @ApiProperty({ example: 'Perawatan Wajah', description: 'Nama kategori' })
  namaKategori: string;

  @ApiProperty({
    example: 'Kategori untuk berbagai jenis perawatan wajah',
    description: 'Deskripsi kategori',
    nullable: true,
  })
  deskripsi?: string;

  @ApiProperty({ example: true, description: 'Status aktif' })
  isActive: boolean;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Tanggal dibuat',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Tanggal diupdate',
  })
  updatedAt: Date;

  constructor(partial: Partial<TreatmentCategoryResponseDto | null>) {
    Object.assign(this, partial);
  }
}
