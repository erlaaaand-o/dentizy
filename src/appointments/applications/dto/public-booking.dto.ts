import {
  IsString,
  IsNotEmpty,
  Length,
  IsDateString,
  IsEnum,
  Matches,
  IsNumber,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer'; // <--- TAMBAHKAN INI
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '../../../patients/domains/entities/patient.entity';

export class PublicBookingDto {
  // --- Identitas Pasien ---
  @ApiProperty({ description: 'Nama lengkap pasien', example: 'Budi Santoso' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nama_lengkap: string;

  @ApiProperty({ description: 'NIK 16 Digit', example: '3201123456789001' })
  @IsString()
  @Length(16, 16, { message: 'NIK harus 16 digit' })
  @Matches(/^\d+$/, { message: 'NIK harus berupa angka' })
  nik: string;

  @ApiProperty({
    description: 'Tanggal Lahir (YYYY-MM-DD)',
    example: '1990-01-01',
  })
  @IsDateString()
  tanggal_lahir: string;

  @ApiProperty({ description: 'Nomor HP (WhatsApp)', example: '08123456789' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(\+62|62|0)[0-9]{9,13}$/, { message: 'Nomor HP tidak valid' })
  no_hp: string;

  @ApiProperty({ enum: Gender, example: Gender.MALE })
  @IsEnum(Gender)
  jenis_kelamin: Gender;

  @ApiProperty({ description: 'Alamat domisili', example: 'Jl. Merdeka No. 1' })
  @IsString()
  @MaxLength(250)
  alamat: string;

  @ApiPropertyOptional({
    description: 'Email (Opsional)',
    example: 'budi@example.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  // --- Data Appointment ---
  @ApiProperty({ description: 'ID Dokter yang dipilih', example: 1 })
  @IsNotEmpty()
  @IsString()
  doctor_id: string;

  @ApiProperty({
    description: 'Tanggal Janji (YYYY-MM-DD)',
    example: '2025-11-20',
  })
  @IsDateString()
  tanggal_janji: string;

  @ApiProperty({ description: 'Jam Janji (HH:mm)', example: '09:00' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: 'Format jam tidak valid (Gunakan HH:mm atau HH:mm:ss)',
  })
  jam_janji: string;

  @ApiProperty({ description: 'Keluhan utama', example: 'Sakit gigi geraham' })
  @IsString()
  @MaxLength(500)
  keluhan: string;
}
