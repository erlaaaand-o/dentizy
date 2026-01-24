import { Injectable } from '@nestjs/common';
import { MedicalRecord } from '../entities/medical-record.entity';
import { CreateMedicalRecordDto } from '../../applications/dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from '../../applications/dto/update-medical-record.dto';
import { MedicalRecordResponseDto } from '../../applications/dto/medical-record-response.dto';

@Injectable()
export class MedicalRecordMapper {
  /**
   * Map Entity to Response DTO
   */
  toResponseDto(entity: MedicalRecord): MedicalRecordResponseDto {
    const response = new MedicalRecordResponseDto();

    response.id = entity.id;
    response.appointment_id = entity.appointment_id;
    response.doctor_id = entity.doctor_id;
    response.patient_id = entity.patient_id;
    response.subjektif = entity.subjektif;
    response.objektif = entity.objektif;
    response.assessment = entity.assessment;
    response.plan = entity.plan;
    response.created_at = entity.created_at;
    response.updated_at = entity.updated_at;
    response.deleted_at = entity.deleted_at;
    response.umur_rekam = Math.floor(
      (new Date().getTime() - entity.created_at.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    // 1. Map Appointment
    if (entity.appointment) {
      response.appointment = {
        id: entity.appointment.id,
        appointment_date: entity.appointment.tanggal_janji,
        status: entity.appointment.status,
        patient: entity.appointment.patient
          ? {
              id: entity.appointment.patient.id,
              nama_lengkap: entity.appointment.patient.nama_lengkap,
              // [FIX] Gunakan nomor_rekam_medis
              nomor_rekam_medis: entity.appointment.patient.nomor_rekam_medis,
            }
          : undefined,
      };
    }

    // 2. Map Doctor (User)
    // Entity User biasanya punya 'nama_lengkap', tapi DTO DoctorSubsetDto pakai 'name'
    if (entity.doctor) {
      response.doctor = {
        id: entity.doctor.id,
        nama_lengkap: entity.doctor.nama_lengkap,
      };
    }

    // 3. Map Patient (Direct Relation)
    if (entity.patient) {
      response.patient = {
        id: entity.patient.id,
        nama_lengkap: entity.patient.nama_lengkap,
        // [FIX] Mapping ke properti baru DTO
        nomor_rekam_medis: entity.patient.nomor_rekam_medis,
        tanggal_lahir: entity.patient.tanggal_lahir,
      };
    }

    // 4. [FIX UTAMA] Map Treatments (Ini yang sebelumnya hilang)
    if (
      entity.medicalRecordTreatments &&
      entity.medicalRecordTreatments.length > 0
    ) {
      response.medical_record_treatments = entity.medicalRecordTreatments.map(
        (mrt) => ({
          id: mrt.id,
          jumlah: mrt.jumlah,
          price_snapshot: Number(mrt.hargaSatuan), // Mapping hargaSatuan entity ke price_snapshot DTO
          treatment: mrt.treatment
            ? {
                namaPerawatan: mrt.treatment.namaPerawatan,
                harga: Number(mrt.treatment.harga),
              }
            : undefined,
        }),
      );
    } else {
      response.medical_record_treatments = [];
    }

    return response;
  }

  /**
   * Map array of entities to response DTOs
   */
  toResponseDtoArray(entities: MedicalRecord[]): MedicalRecordResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }

  // ... (sisa method toEntity, toUpdateEntity biarkan saja seperti semula)
  toEntity(
    dto: CreateMedicalRecordDto,
    userId: string,
  ): Partial<MedicalRecord> {
    return {
      appointment_id: dto.appointment_id,
      doctor_id: userId,
      subjektif: dto.subjektif?.trim() || undefined,
      objektif: dto.objektif?.trim() || undefined,
      assessment: dto.assessment?.trim() || undefined,
      plan: dto.plan?.trim() || undefined,
    };
  }

  toUpdateEntity(dto: UpdateMedicalRecordDto): Partial<MedicalRecord> {
    const updateData: Partial<MedicalRecord> = {};
    if (dto.subjektif !== undefined)
      updateData.subjektif = dto.subjektif?.trim() || undefined;
    if (dto.objektif !== undefined)
      updateData.objektif = dto.objektif?.trim() || undefined;
    if (dto.assessment !== undefined)
      updateData.assessment = dto.assessment?.trim() || undefined;
    if (dto.plan !== undefined) updateData.plan = dto.plan?.trim() || undefined;
    return updateData;
  }

  toMinimalResponse(entity: MedicalRecord): Partial<MedicalRecordResponseDto> {
    return {
      id: entity.id,
      appointment_id: entity.appointment_id,
      subjektif: entity.subjektif,
      objektif: entity.objektif,
      assessment: entity.assessment,
      plan: entity.plan,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
  }
}
