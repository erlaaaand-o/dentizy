// backend/src/payments/applications/dto/create-payment.dto.ts
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  MetodePembayaran,
  StatusPembayaran,
} from '../../domains/entities/payments.entity';
import {
  IsNotFutureDate,
  IsSufficientPayment,
} from '../../domains/validators/';

export class CreatePaymentDto {
  @ApiProperty({ description: 'ID Rekam Medis', example: 1 })
  @IsString({ message: 'Medical Record ID harus berupa UUID' })
  medicalRecordId: string;

  @ApiProperty({ description: 'ID Pasien', example: 1 })
  @IsString({ message: 'Patient ID harus berupa UUID' })
  patientId: string;

  @ApiProperty({
    description: 'Tanggal pembayaran',
    example: '2024-01-15T10:30:00.000Z',
    type: String,
    format: 'date-time',
  })
  @IsDateString({}, { message: 'Format tanggal tidak valid' })
  @IsNotFutureDate()
  tanggalPembayaran: Date;

  @ApiProperty({
    description: 'Total biaya',
    example: 500000,
    minimum: 0,
  })
  @IsNumber({}, { message: 'Total biaya harus berupa angka' })
  @Min(0, { message: 'Total biaya tidak boleh negatif' })
  totalBiaya: number;

  @ApiProperty({
    description: 'Jumlah yang dibayarkan',
    example: 450000,
    minimum: 0,
  })
  @IsNumber({}, { message: 'Jumlah bayar harus berupa angka' })
  @Min(0, { message: 'Jumlah bayar tidak boleh negatif' })
  @IsSufficientPayment()
  jumlahBayar: number;

  @ApiProperty({
    description: 'Metode pembayaran',
    enum: MetodePembayaran,
    example: MetodePembayaran.TUNAI,
  })
  @IsEnum(MetodePembayaran, { message: 'Metode pembayaran tidak valid' })
  metodePembayaran: MetodePembayaran;

  @ApiPropertyOptional({
    description: 'Status pembayaran',
    enum: StatusPembayaran,
    example: StatusPembayaran.LUNAS,
  })
  @IsOptional()
  @IsEnum(StatusPembayaran, { message: 'Status pembayaran tidak valid' })
  statusPembayaran?: StatusPembayaran;

  @ApiPropertyOptional({
    description: 'Keterangan tambahan',
    example: 'Pembayaran lunas',
  })
  @IsOptional()
  @IsString({ message: 'Keterangan harus berupa teks' })
  keterangan?: string;

  @ApiPropertyOptional({ description: 'ID user yang membuat', example: 1 })
  @IsOptional()
  @IsInt({ message: 'Created By harus berupa UUID' })
  createdBy?: string;
}
