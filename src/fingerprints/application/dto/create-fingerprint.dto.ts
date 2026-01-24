import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsString,
  IsOptional,
  MaxLength,
} from 'class-validator';
import {
  FingerPosition,
  FingerprintQuality,
} from '../../domains/entities/fingerprint.entity';

export class CreateFingerprintDto {
  @ApiProperty({ description: 'ID Pasien', example: 1 })
  @IsNotEmpty({ message: 'Patient ID harus diisi' })
  @IsNumber({}, { message: 'Patient ID harus berupa angka' })
  patient_id: string;

  @ApiProperty({
    description: 'Posisi jari',
    enum: FingerPosition,
    example: FingerPosition.RIGHT_INDEX,
  })
  @IsNotEmpty({ message: 'Posisi jari harus diisi' })
  @IsEnum(FingerPosition, { message: 'Posisi jari tidak valid' })
  finger_position: FingerPosition;

  @ApiProperty({
    description: 'Template data sidik jari (Base64 encoded)',
    example: 'Rk1SACAyMAAAAAD...',
  })
  @IsNotEmpty({ message: 'Template data harus diisi' })
  @IsString({ message: 'Template data harus berupa string' })
  template_data: string;

  @ApiPropertyOptional({ description: 'ID perangkat', example: 'ZKTECO-001' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  device_id?: string;

  @ApiPropertyOptional({
    description: 'Model perangkat',
    example: 'ZKTeco ZK4500',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  device_model?: string;

  @ApiPropertyOptional({
    description: 'Kualitas template',
    enum: FingerprintQuality,
  })
  @IsOptional()
  @IsEnum(FingerprintQuality)
  quality?: FingerprintQuality;

  @ApiPropertyOptional({
    description: 'Skor kualitas (0-100)',
    example: 85,
  })
  @IsOptional()
  @IsNumber()
  match_score?: number;

  @ApiPropertyOptional({ description: 'Catatan tambahan' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
