import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';

export class VerifyFingerprintDto {
  @ApiProperty({
    description: 'Template data sidik jari untuk verifikasi',
    example: 'Rk1SACAyMAAAAAD...',
  })
  @IsNotEmpty({ message: 'Template data harus diisi' })
  @IsString({ message: 'Template data harus berupa string' })
  template_data: string;

  @ApiPropertyOptional({
    description: 'Threshold matching (0-100, default: 70)',
    example: 70,
  })
  @IsOptional()
  @IsNumber()
  threshold?: number;

  @ApiPropertyOptional({
    description: 'Patient ID untuk verifikasi 1:1 (opsional)',
  })
  @IsOptional()
  @IsNumber()
  patient_id?: string;
}
