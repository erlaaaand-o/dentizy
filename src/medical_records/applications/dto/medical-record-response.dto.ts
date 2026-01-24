import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { AppointmentStatus } from '../../../appointments/domains/entities/appointment.entity';
export class PatientSubsetDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: string;

  @ApiProperty({ example: 'Budi Santoso' })
  @Expose()
  nama_lengkap: string;

  @ApiProperty({ example: 'RM-2023-001' })
  @Expose()
  nomor_rekam_medis: string;

  @ApiPropertyOptional({ example: '1990-01-01', type: Date, nullable: true })
  @Expose()
  @Type(() => Date)
  tanggal_lahir?: Date | null;
}

export class DoctorSubsetDto {
  @ApiProperty({ example: 101 })
  @Expose()
  id: string;

  @ApiProperty({ example: 'dr. Strange' })
  @Expose()
  nama_lengkap: string;
}

export class TreatmentSubsetDto {
  @ApiProperty({ example: 'Scalling Gigi' })
  @Expose()
  namaPerawatan: string;

  @ApiProperty({ example: 500000 })
  @Expose()
  harga: number;
}

// [FIX] Ganti nama class ini agar tidak bentrok dengan DTO di modul lain
export class MedicalRecordTreatmentSubsetDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: string;

  @ApiProperty({ example: 1 })
  @Expose()
  jumlah: number;

  @ApiProperty({ example: 500000 })
  @Expose()
  price_snapshot: number;

  @ApiPropertyOptional({ type: TreatmentSubsetDto })
  @Expose()
  @Type(() => TreatmentSubsetDto)
  treatment?: TreatmentSubsetDto;
}

export class AppointmentSubsetDto {
  @ApiProperty({ example: 500 })
  @Expose()
  id: string;

  @ApiProperty({ example: '2023-11-20T09:00:00Z' })
  @Expose()
  @Type(() => Date)
  appointment_date: Date;

  @ApiProperty({
    enum: AppointmentStatus,
    example: AppointmentStatus.DIJADWALKAN,
  })
  @Expose()
  status: AppointmentStatus;

  @ApiPropertyOptional({ type: PatientSubsetDto })
  @Expose()
  @Type(() => PatientSubsetDto)
  patient?: PatientSubsetDto | null;
}

// --- MAIN DTO ---

export class MedicalRecordResponseDto {
  @ApiProperty({ example: 1, description: 'ID unik rekam medis' })
  @Expose()
  id: string;

  @ApiProperty({ example: 500 })
  @Expose()
  appointment_id: string;

  @ApiProperty({ example: 101 })
  @Expose()
  doctor_id: string;

  @ApiProperty({ example: 1 })
  @Expose()
  patient_id: string;

  @ApiPropertyOptional({ example: 'Pasien mengeluh pusing', nullable: true })
  @Expose()
  subjektif: string | null;

  @ApiPropertyOptional({ example: 'Tekanan darah 120/80', nullable: true })
  @Expose()
  objektif: string | null;

  @ApiPropertyOptional({ example: 'Hipertensi ringan', nullable: true })
  @Expose()
  assessment: string | null;

  @ApiPropertyOptional({ example: 'Resep Amlodipine 5mg', nullable: true })
  @Expose()
  plan: string | null;

  @ApiProperty({ example: '2023-11-20T10:00:00Z' })
  @Expose()
  @Type(() => Date)
  created_at: Date;

  @ApiProperty({ example: '2023-11-20T10:00:00Z' })
  @Expose()
  @Type(() => Date)
  updated_at: Date;

  @ApiPropertyOptional({ example: null, nullable: true })
  @Expose()
  @Type(() => Date)
  deleted_at: Date | null;

  @ApiProperty({ example: 35 })
  @Expose()
  umur_rekam: number;

  // --- RELATIONS ---

  @ApiPropertyOptional({ type: AppointmentSubsetDto })
  @Expose()
  @Type(() => AppointmentSubsetDto)
  appointment?: AppointmentSubsetDto | null;

  @ApiPropertyOptional({ type: DoctorSubsetDto })
  @Expose()
  @Type(() => DoctorSubsetDto)
  doctor?: DoctorSubsetDto | null;

  @ApiPropertyOptional({ type: PatientSubsetDto })
  @Expose()
  @Type(() => PatientSubsetDto)
  patient?: PatientSubsetDto | null;

  // [FIX] Update referensi class di sini juga
  @ApiPropertyOptional({ type: [MedicalRecordTreatmentSubsetDto] })
  @Expose()
  @Type(() => MedicalRecordTreatmentSubsetDto)
  medical_record_treatments?: MedicalRecordTreatmentSubsetDto[];
}
