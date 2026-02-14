import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsDateString,
  IsEmail,
  IsEnum,
  IsBoolean,
  Length,
} from 'class-validator';

import { Gender } from '../../domains/entities/patient.entity';

import { CreatePatientDto } from './create-patient.dto';

export class UpdatePatientDto extends PartialType(CreatePatientDto) {
  @ApiPropertyOptional({
    description: 'Nomor rekam medis pasien',
    example: 'RM123456',
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  nomor_rekam_medis?: string;

  @ApiPropertyOptional({
    description: 'Nomor Induk Kependudukan (NIK)',
    example: '1234567890123456',
  })
  @IsOptional()
  @IsString()
  @Length(1, 16)
  nik?: string;

  @ApiPropertyOptional({
    description: 'Nama lengkap pasien',
    example: 'Budi Santoso',
  })
  @IsOptional()
  @IsString()
  @Length(1, 250)
  nama_lengkap?: string;

  @ApiPropertyOptional({
    description: 'Tanggal lahir pasien',
    example: '1990-01-01', // Sesuai example ini, backend mengharapkan YYYY-MM-DD
  })
  @IsOptional()
  @IsDateString()
  tanggal_lahir?: string;

  @ApiPropertyOptional({
    description: 'Alamat pasien',
    example: 'Jl. Merdeka No. 10, Jakarta',
  })
  @IsOptional()
  @IsString()
  alamat?: string;

  @ApiPropertyOptional({
    description: 'Email pasien',
    example: 'budi@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Nomor HP pasien',
    example: '081234567890',
  })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  no_hp?: string;

  @ApiPropertyOptional({
    description: 'Jenis kelamin pasien',
    example: Gender.MALE,
    enum: Gender,
  })
  @IsOptional()
  @IsEnum(Gender)
  jenis_kelamin?: Gender;

  @ApiPropertyOptional({
    description: 'Status registrasi online pasien',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Status registrasi online harus berupa boolean' })
  is_registered_online?: boolean;

  @ApiPropertyOptional({
    description: 'Status aktif pasien',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Status aktif harus berupa boolean' })
  is_active?: boolean;
}
