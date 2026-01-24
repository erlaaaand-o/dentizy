import {
  IsOptional,
  IsNumber,
  IsString,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatus } from '../../../appointments/domains/entities/appointment.entity';

export class SearchMedicalRecordDto {
  @ApiProperty({
    description: 'Filter berdasarkan ID pasien',
    example: 12,
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  patient_id?: string;

  @ApiProperty({
    description: 'Filter berdasarkan ID dokter',
    example: 5,
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  doctor_id?: string;

  @ApiProperty({
    description: 'Filter berdasarkan ID appointment',
    example: 1001,
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  appointment_id?: string;

  @ApiProperty({
    description:
      'Pencarian umum (berlaku untuk field SOAP: Subjective, Objective, Assessment, Plan)',
    example: 'demam tinggi',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Tanggal mulai untuk filter rekam medis',
    example: '2025-01-01',
    required: false,
    type: String,
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string | Date;

  @ApiProperty({
    description: 'Tanggal akhir untuk filter rekam medis',
    example: '2025-01-31',
    required: false,
    type: String,
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string | Date;

  @ApiProperty({
    description: 'Filter berdasarkan status appointment',
    enum: AppointmentStatus,
    required: false,
    example: AppointmentStatus.SELESAI,
  })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  appointment_status?: AppointmentStatus;

  @ApiProperty({
    description: 'Nomor halaman untuk pagination',
    example: 1,
    required: false,
    type: Number,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({
    description: 'Jumlah data per halaman',
    example: 10,
    required: false,
    type: Number,
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 10;

  @ApiProperty({
    description: 'Field untuk sorting',
    example: 'created_at',
    required: false,
    type: String,
    default: 'created_at',
  })
  @IsOptional()
  @IsString()
  sort_by?: string = 'created_at';

  @ApiProperty({
    description: 'Urutan sorting (ASC atau DESC)',
    enum: ['ASC', 'DESC'],
    required: false,
    example: 'DESC',
    default: 'DESC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sort_order?: 'ASC' | 'DESC' = 'DESC';
}
