import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer'; // Penting untuk konversi string query ke tipe asli
import { IsOptional, IsInt, IsEnum, IsString, IsDate } from 'class-validator';
import { AppointmentStatus } from '../../../appointments/domains/entities/appointment.entity';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class FindAllMedicalRecordQueryDto {
  @ApiPropertyOptional({
    description: 'Filter berdasarkan ID Pasien',
    example: 1,
  })
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan ID Dokter',
    example: 2,
  })
  @IsOptional()
  @IsString()
  doctorId?: string;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan ID Appointment',
    example: 100,
  })
  @IsOptional()
  @IsString()
  appointmentId?: string;

  @ApiPropertyOptional({
    description: 'Pencarian teks bebas (misal: diagnosa/keluhan)',
    example: 'demam',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter tanggal awal (Format YYYY-MM-DD)',
    example: '2024-11-01',
    type: Date,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date) // Mengubah string tanggal menjadi Object Date
  startDate?: Date;

  @ApiPropertyOptional({
    description: 'Filter tanggal akhir (Format YYYY-MM-DD)',
    example: '2024-11-30',
    type: Date,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan status appointment',
    enum: AppointmentStatus,
    example: AppointmentStatus.SELESAI,
  })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional({
    description: 'Halaman ke berapa (Pagination)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  page?: number = 1; // Default value level Typescript

  @ApiPropertyOptional({
    description: 'Jumlah data per halaman',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Field untuk sorting',
    example: 'created_at',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Urutan sorting (ASC/DESC)',
    enum: SortOrder, // Menggunakan enum agar muncul dropdown di Swagger
    example: SortOrder.DESC,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
