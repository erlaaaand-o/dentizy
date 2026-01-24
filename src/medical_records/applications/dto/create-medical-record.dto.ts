import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMedicalRecordDto {
  @ApiProperty({
    description: 'ID dari appointment yang terkait dengan rekam medis',
    example: 1203,
    required: true,
    type: String,
  })
  @IsNotEmpty({ message: 'Appointment ID harus diisi' })
  @IsNumber()
  appointment_id: string;

  @ApiProperty({
    description: 'ID user staff (perawat/dokter) yang membuat rekam medis',
    example: 7,
    required: true,
    type: String,
  })
  @IsNotEmpty({ message: 'User ID staff harus diisi' })
  @IsNumber()
  user_id_staff: string;

  @ApiProperty({
    description: 'Bagian Subjektif dari SOAP (keluhan pasien)',
    example: 'Pasien mengeluh demam sejak 2 hari lalu.',
    required: false,
    maxLength: 5000,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: 'Subjektif maksimal 5000 karakter' })
  @Transform(({ value }) => value?.trim())
  subjektif?: string;

  @ApiProperty({
    description: 'Bagian Objektif dari SOAP (hasil pemeriksaan fisik/lab)',
    example: 'Tekanan darah 120/80 mmHg, suhu 38.2°C.',
    required: false,
    maxLength: 5000,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: 'Objektif maksimal 5000 karakter' })
  @Transform(({ value }) => value?.trim())
  objektif?: string;

  @ApiProperty({
    description: 'Bagian Assessment dari SOAP (diagnosis)',
    example: 'Diagnosis: Demam virus.',
    required: false,
    maxLength: 5000,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: 'Assessment maksimal 5000 karakter' })
  @Transform(({ value }) => value?.trim())
  assessment?: string;

  @ApiProperty({
    description: 'Bagian Plan dari SOAP (rencana terapi & tindak lanjut)',
    example: 'Berikan parasetamol 3x sehari. Kontrol 3 hari lagi.',
    required: false,
    maxLength: 5000,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: 'Plan maksimal 5000 karakter' })
  @Transform(({ value }) => value?.trim())
  plan?: string;
}
