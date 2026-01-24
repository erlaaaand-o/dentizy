import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Expose } from 'class-transformer';

// Sub-DTO Sederhana
class PatientSubsetDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  namaLengkap: string;

  @ApiProperty()
  @Expose()
  nomorRekamMedis: string;
}

class MedicalRecordSubsetDto {
  @ApiProperty()
  @Expose()
  id: string;
}

export class PaymentResponseDto {
  @ApiProperty({ description: 'ID Pembayaran' })
  id: string;

  @ApiProperty({ description: 'ID Rekam Medis' })
  medicalRecordId: string;

  @ApiProperty({ description: 'ID Pasien' })
  patientId: string;

  @ApiProperty({ description: 'Nomor Invoice' })
  nomorInvoice: string;

  @ApiProperty({ description: 'Tanggal Pembayaran' })
  tanggalPembayaran: Date;

  @ApiProperty({ description: 'Total Biaya' })
  totalBiaya: number;

  @ApiProperty({ description: 'Total Akhir' })
  totalAkhir: number;

  @ApiProperty({ description: 'Jumlah yang Dibayar' })
  jumlahBayar: number;

  @ApiProperty({ description: 'Kembalian' })
  kembalian: number;

  @ApiProperty({ description: 'Metode Pembayaran' })
  metodePembayaran: string;

  @ApiProperty({ description: 'Status Pembayaran' })
  statusPembayaran: string;

  @ApiPropertyOptional({ description: 'Keterangan' })
  keterangan?: string;

  @ApiPropertyOptional({ description: 'ID Pembuat' })
  createdBy?: string;

  @ApiProperty({ description: 'Tanggal Dibuat' })
  createdAt: Date;

  @ApiProperty({ description: 'Tanggal Diupdate' })
  updatedAt: Date;

  @ApiPropertyOptional({ type: PatientSubsetDto })
  @Type(() => PatientSubsetDto)
  patient?: PatientSubsetDto;

  @ApiPropertyOptional({ type: MedicalRecordSubsetDto })
  @Type(() => MedicalRecordSubsetDto)
  medicalRecord?: MedicalRecordSubsetDto;

  constructor(partial: Partial<PaymentResponseDto>) {
    Object.assign(this, partial);
  }
}
