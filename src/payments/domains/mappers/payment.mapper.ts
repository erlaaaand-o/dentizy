// backend/src/payments/applications/mappers/payment.mapper.ts
import { Injectable } from '@nestjs/common';

import { Payment } from '../entities/payments.entity';
import { PaymentResponseDto } from '../../applications/dto/payment-response.dto';
import { CreatePaymentDto } from '../../applications/dto/create-payment.dto';

@Injectable()
export class PaymentMapper {
  toResponseDto(entity: Payment): PaymentResponseDto {
    const dto = new PaymentResponseDto({
      id: entity.id,
      medicalRecordId: entity.medicalRecordId,
      patientId: entity.patientId,
      nomorInvoice: entity.nomorInvoice,
      tanggalPembayaran: entity.tanggalPembayaran,
      totalBiaya: Number(entity.totalBiaya),
      totalAkhir: Number(entity.totalAkhir),
      jumlahBayar: Number(entity.jumlahBayar),
      kembalian: Number(entity.kembalian),
      metodePembayaran: entity.metodePembayaran,
      statusPembayaran: entity.statusPembayaran,
      keterangan: entity.keterangan ?? undefined,
      createdBy: entity.createdBy ?? undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });

    // [FIX UTAMA] Mapping Relasi Pasien (Agar Frontend bisa baca nama pasien)
    if (entity.patient) {
      dto.patient = {
        id: entity.patient.id,
        namaLengkap: entity.patient.nama_lengkap,
        nomorRekamMedis: entity.patient.nomor_rekam_medis,
      };
    }

    // [FIX UTAMA] Mapping Relasi Medical Record (Agar Frontend bisa baca detail medis)
    if (entity.medicalRecord) {
      dto.medicalRecord = {
        id: entity.medicalRecord.id,
        // Tambahkan field lain jika perlu, misal: tanggal kunjungan
      };
    }

    return dto;
  }

  toResponseDtoList(entities: Payment[]): PaymentResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }

  toEntity(
    dto: CreatePaymentDto,
    additionalData?: Partial<Payment>,
  ): Partial<Payment> {
    return {
      medicalRecordId: dto.medicalRecordId,
      patientId: dto.patientId,
      tanggalPembayaran: new Date(dto.tanggalPembayaran),
      totalBiaya: dto.totalBiaya,
      jumlahBayar: dto.jumlahBayar,
      metodePembayaran: dto.metodePembayaran,
      statusPembayaran: dto.statusPembayaran,
      keterangan: dto.keterangan,
      createdBy: dto.createdBy,
      ...additionalData,
    };
  }
}
