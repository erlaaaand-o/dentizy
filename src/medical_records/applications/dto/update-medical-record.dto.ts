import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMedicalRecordDto {
  @ApiProperty({
    description: 'Update bagian Subjektif dari SOAP (keluhan pasien)',
    example: 'Pasien merasa lebih baik dibanding sebelumnya.',
    required: false,
    nullable: true,
    maxLength: 5000,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  subjektif?: string | null;

  @ApiProperty({
    description:
      'Update bagian Objektif dari SOAP (hasil pemeriksaan fisik/lab)',
    example: 'Suhu turun menjadi 37.5°C.',
    required: false,
    nullable: true,
    maxLength: 5000,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  objektif?: string | null;

  @ApiProperty({
    description:
      'Update bagian Assessment dari SOAP (diagnosis sementara/lanjutan)',
    example: 'Diagnosis tetap demam virus, gejala membaik.',
    required: false,
    nullable: true,
    maxLength: 5000,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  assessment?: string | null;

  @ApiProperty({
    description:
      'Update bagian Plan dari SOAP (rencana terapi & tindak lanjut)',
    example: 'Tetap lanjut parasetamol 2x sehari. Kontrol besok.',
    required: false,
    nullable: true,
    maxLength: 5000,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  plan?: string | null;
}
