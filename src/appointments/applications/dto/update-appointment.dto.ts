import {
  IsEnum,
  IsOptional,
  IsString,
  IsDateString,
  Matches,
  MaxLength,
  IsNumber,
  ValidateNested, // [BARU]
  IsArray, // [BARU]
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { AppointmentStatus } from '../../domains/entities/appointment.entity';

// [BARU] Definisi DTO untuk Medical Record yang bersarang
class MedicalRecordPayloadDto {
  @IsOptional()
  @IsString()
  subjektif?: string;

  @IsOptional()
  @IsString()
  objektif?: string;

  @IsOptional()
  @IsString()
  assessment?: string;

  @IsOptional()
  @IsString()
  plan?: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  treatment_ids?: string[];
}

export class UpdateAppointmentDto {
  @IsOptional()
  @IsString()
  patient_id?: string;

  @IsOptional()
  @IsString()
  doctor_id?: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsDateString()
  tanggal_janji?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
  jam_janji?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => value?.trim())
  keluhan?: string;

  // [BARU] Property ini mengizinkan payload nested 'medical_record'
  @IsOptional()
  @ValidateNested()
  @Type(() => MedicalRecordPayloadDto)
  medical_record?: MedicalRecordPayloadDto;
}
