import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  FingerPosition,
  FingerprintQuality,
} from '../../domains/entities/fingerprint.entity';

export class FingerprintResponseDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  patient_id: number;

  @ApiProperty({ enum: FingerPosition })
  @Expose()
  finger_position: FingerPosition;

  @ApiProperty()
  @Expose()
  device_id: string;

  @ApiProperty()
  @Expose()
  device_model: string;

  @ApiProperty({ enum: FingerprintQuality })
  @Expose()
  quality: FingerprintQuality;

  @ApiProperty()
  @Expose()
  match_score: number;

  @ApiProperty()
  @Expose()
  verification_count: number;

  @ApiProperty()
  @Expose()
  @Type(() => Date)
  last_verified_at: Date;

  @ApiProperty()
  @Expose()
  is_active: boolean;

  @ApiProperty()
  @Expose()
  notes: string;

  @ApiProperty()
  @Expose()
  @Type(() => Date)
  created_at: Date;

  @ApiProperty()
  @Expose()
  display_name: string;

  // Exclude template_data from response for security
}

export class VerifyFingerprintResponseDto {
  @ApiProperty()
  @Expose()
  matched: boolean;

  @ApiProperty()
  @Expose()
  patient_id: string | null;

  @ApiProperty()
  @Expose()
  fingerprint_id: string | null;

  @ApiProperty()
  @Expose()
  match_score: number;

  @ApiProperty()
  @Expose()
  confidence: number;

  @ApiProperty()
  @Expose()
  patient_name: string | null;

  @ApiProperty()
  @Expose()
  medical_record_number: string | null;
}
