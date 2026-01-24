import { Injectable } from '@nestjs/common';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { User } from '../../../users/domains/entities/user.entity';
import { Patient } from '../../../patients/domains/entities/patient.entity';
import { CreateAppointmentDto } from '../../applications/dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../../applications/dto/update-appointment.dto';

/**
 * Domain service untuk business logic appointment
 * Pure business logic tanpa infrastructure concerns
 */
@Injectable()
export class AppointmentDomainService {
  /**
   * Create appointment entity dari DTO
   */
  createAppointmentEntity(
    dto: CreateAppointmentDto,
    patient: Patient,
    doctor: User,
    tanggalJanji: Date,
  ): Partial<Appointment> {
    return {
      patient_id: dto.patient_id,
      doctor_id: dto.doctor_id,
      tanggal_janji: tanggalJanji,
      jam_janji: dto.jam_janji,
      keluhan: dto.keluhan,
      status: dto.status || AppointmentStatus.DIJADWALKAN,
      patient,
      doctor,
    };
  }

  /**
   * Update appointment dengan data baru
   */
  updateAppointmentEntity(
    appointment: Appointment,
    updateDto: UpdateAppointmentDto,
  ): Appointment {
    if (updateDto.status !== undefined) {
      appointment.status = updateDto.status;
    }

    if (updateDto.tanggal_janji !== undefined) {
      appointment.tanggal_janji = new Date(updateDto.tanggal_janji);
    }

    if (updateDto.jam_janji !== undefined) {
      appointment.jam_janji = updateDto.jam_janji;
    }

    if (updateDto.keluhan !== undefined) {
      appointment.keluhan = updateDto.keluhan;
    }

    return appointment;
  }

  /**
   * Complete appointment (ubah status ke SELESAI)
   */
  completeAppointment(appointment: Appointment): Appointment {
    appointment.status = AppointmentStatus.SELESAI;
    return appointment;
  }

  /**
   * Cancel appointment (ubah status ke DIBATALKAN)
   */
  cancelAppointment(appointment: Appointment): Appointment {
    appointment.status = AppointmentStatus.DIBATALKAN;
    return appointment;
  }

  /**
   * Cek apakah appointment memerlukan reminder
   */
  shouldScheduleReminder(appointment: Appointment): boolean {
    return !!(
      appointment.patient?.email &&
      appointment.patient?.is_registered_online &&
      appointment.status === AppointmentStatus.DIJADWALKAN
    );
  }

  /**
   * Parse jam janji ke format Date untuk comparison
   */
  parseAppointmentDateTime(tanggalJanji: Date, jamJanji: string): Date {
    const [hours, minutes, seconds = 0] = jamJanji.split(':').map(Number);
    const dateTime = new Date(tanggalJanji);
    dateTime.setHours(hours, minutes, seconds, 0);
    return dateTime;
  }

  /**
   * Cek apakah update waktu (perlu reschedule reminder)
   */
  isTimeUpdated(updateDto: UpdateAppointmentDto): boolean {
    return !!(updateDto.tanggal_janji || updateDto.jam_janji);
  }
}
