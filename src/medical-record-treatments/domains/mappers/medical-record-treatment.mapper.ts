// backend/src/medical-record-treatments/applications/mappers/medical-record-treatment.mapper.ts
import { Injectable } from '@nestjs/common';
import { MedicalRecordTreatment } from '../../domains/entities/medical-record-treatments.entity';
import { MedicalRecordTreatmentResponseDto } from '../../applications/dto/medical-record-treatment-response.dto';
import { CreateMedicalRecordTreatmentDto } from '../../applications/dto/create-medical-record-treatment.dto';

@Injectable()
export class MedicalRecordTreatmentMapper {
  toResponseDto(
    entity: MedicalRecordTreatment,
  ): MedicalRecordTreatmentResponseDto {
    return new MedicalRecordTreatmentResponseDto({
      id: entity.id,
      medicalRecordId: entity.medicalRecordId,
      treatmentId: entity.treatmentId,
      jumlah: entity.jumlah,
      hargaSatuan: Number(entity.hargaSatuan),
      subtotal: Number(entity.subtotal),
      diskon: Number(entity.diskon),
      total: Number(entity.total),
      keterangan: entity.keterangan,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      treatment: entity.treatment
        ? {
            id: entity.treatment.id,
            kodePerawatan: entity.treatment.kodePerawatan,
            namaPerawatan: entity.treatment.namaPerawatan,
            harga: Number(entity.treatment.harga),
          }
        : undefined,
    });
  }

  toResponseDtoList(
    entities: MedicalRecordTreatment[],
  ): MedicalRecordTreatmentResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }

  toEntity(
    dto: CreateMedicalRecordTreatmentDto,
    calculation: { subtotal: number; total: number },
  ): Partial<MedicalRecordTreatment> {
    return {
      medicalRecordId: dto.medicalRecordId,
      treatmentId: dto.treatmentId,
      jumlah: dto.jumlah,
      hargaSatuan: dto.hargaSatuan,
      diskon: dto.diskon || 0,
      subtotal: calculation.subtotal,
      total: calculation.total,
      keterangan: dto.keterangan,
    };
  }
}

// backend/src/medical-record-treatments/applications/mappers/index.ts
export * from './medical-record-treatment.mapper';
