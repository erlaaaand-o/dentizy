import { Injectable } from '@nestjs/common';
import { Appointment } from '../entities/appointment.entity';
import {
  AppointmentResponseDto,
  PaginatedAppointmentResponseDto,
} from '../../applications/dto/appointment-response.dto';

/**
 * Mapper untuk konversi Entity ↔ DTO
 */
@Injectable()
export class AppointmentMapper {
  /**
   * Convert entity ke response DTO
   */
  toResponseDto(appointment: Appointment): AppointmentResponseDto {
    return {
      id: appointment.id,
      patient_id: appointment.patient_id,
      doctor_id: appointment.doctor_id,
      status: appointment.status,
      tanggal_janji: appointment.tanggal_janji,
      jam_janji: appointment.jam_janji,
      keluhan: appointment.keluhan,
      created_at: appointment.created_at,
      updated_at: appointment.updated_at,

      // Relations (optional)
      patient: appointment.patient
        ? {
            id: appointment.patient.id,
            nama_lengkap: appointment.patient.nama_lengkap,
            nomor_rekam_medis: appointment.patient.nomor_rekam_medis,
            nik: appointment.patient.nik,
            is_active: appointment.patient.is_active,
            email: appointment.patient.email ?? undefined,
            nomor_telepon: appointment.patient.no_hp ?? undefined,
          }
        : undefined,

      doctor: appointment.doctor
        ? {
            id: appointment.doctor.id,
            nama_lengkap: appointment.doctor.nama_lengkap,
            roles: appointment.doctor.roles?.map((role) => role.name),
          }
        : undefined,

      medical_record: appointment.medical_record
        ? {
            id: appointment.medical_record.id,
            appointment_id: appointment.medical_record.appointment_id,
            subjektif: appointment.medical_record.subjektif,
            objektif: appointment.medical_record.objektif,
            assessment: appointment.medical_record.assessment,
            plan: appointment.medical_record.plan,
            created_at: appointment.medical_record.created_at,
            updated_at: appointment.medical_record.updated_at,
          }
        : undefined,
    };
  }

  /**
   * Convert array entities ke array response DTOs
   */
  toResponseDtoList(appointments: Appointment[]): AppointmentResponseDto[] {
    return appointments.map((appointment) => this.toResponseDto(appointment));
  }

  /**
   * Convert paginated result
   */
  toPaginatedResponse(
    appointments: Appointment[],
    total: number,
    page: number,
    limit: number,
  ): PaginatedAppointmentResponseDto {
    return {
      data: this.toResponseDtoList(appointments),
      count: total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  }
}
