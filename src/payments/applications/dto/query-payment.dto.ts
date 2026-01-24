// backend/src/payments/applications/dto/query-payment.dto.ts
import {
  IsOptional,
  IsInt,
  IsEnum,
  IsDateString,
  Min,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  MetodePembayaran,
  StatusPembayaran,
} from '../../domains/entities/payments.entity';

export class QueryPaymentDto {
  @ApiPropertyOptional({ description: 'Filter berdasarkan Medical Record ID' })
  @IsOptional()
  @IsString()
  medicalRecordId?: string;

  @ApiPropertyOptional({ description: 'Filter berdasarkan Patient ID' })
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan status pembayaran',
    enum: StatusPembayaran,
  })
  @IsOptional()
  @IsEnum(StatusPembayaran)
  statusPembayaran?: StatusPembayaran;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan metode pembayaran',
    enum: MetodePembayaran,
  })
  @IsOptional()
  @IsEnum(MetodePembayaran)
  metodePembayaran?: MetodePembayaran;

  @ApiPropertyOptional({ description: 'Tanggal mulai (ISO format)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Tanggal akhir (ISO format)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Cari berdasarkan nomor invoice' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Halaman', default: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Jumlah data per halaman',
    default: 10,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
}
