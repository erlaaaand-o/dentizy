import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { AppointmentStatus } from '../../domains/entities/appointment.entity';

export class CreateAppointmentDto {
  @IsNotEmpty({ message: 'Patient ID harus diisi' })
  @IsString()
  patient_id: string;

  @IsNotEmpty({ message: 'Doctor ID harus diisi' })
  @IsString()
  doctor_id: string;

  @IsNotEmpty({ message: 'Tanggal janji harus diisi' })
  @IsDateString({}, { message: 'Format tanggal tidak valid (YYYY-MM-DD)' })
  tanggal_janji: string;

  @IsNotEmpty({ message: 'Jam janji harus diisi' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'Format jam tidak valid (HH:mm:ss, contoh: 09:00:00)',
  })
  jam_janji: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Keluhan maksimal 1000 karakter' })
  @Transform(({ value }) => value?.trim())
  keluhan?: string;
}
