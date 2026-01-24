import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { User } from '../../../users/domains/entities/user.entity';
import { UserRole } from '../../../roles/entities/role.entity';

/**
 * Validator umum untuk appointment
 */
@Injectable()
export class AppointmentValidator {
  /**
   * Validasi appointment exists
   */
  validateAppointmentExists(appointment: Appointment | null, id: string): void {
    if (!appointment) {
      throw new NotFoundException(
        `Janji temu dengan ID #${id} tidak ditemukan`,
      );
    }
  }

  /**
   * Validasi authorization untuk melihat appointment
   * Dokter hanya bisa lihat appointmentnya sendiri
   */
  validateViewAuthorization(appointment: Appointment, user: User): void {
    const isDoctor = user.roles.some((role) => role.name === UserRole.DOKTER);
    const isKepalaKlinik = user.roles.some(
      (role) => role.name === UserRole.KEPALA_KLINIK,
    );

    if (isDoctor && !isKepalaKlinik && appointment.doctor_id !== user.id) {
      throw new ForbiddenException(
        'Anda tidak memiliki akses ke janji temu ini',
      );
    }
  }

  /**
   * Validasi status untuk completion
   */
  validateStatusForCompletion(appointment: Appointment): void {
    if (appointment.status !== AppointmentStatus.DIJADWALKAN) {
      throw new ConflictException(
        `Hanya janji temu yang berstatus 'dijadwalkan' yang bisa diselesaikan. Status saat ini: ${appointment.status}`,
      );
    }
  }

  /**
   * Validasi authorization untuk completion
   * Hanya dokter yang menangani yang bisa complete
   */
  validateCompletionAuthorization(appointment: Appointment, user: User): void {
    const isKepalaKlinik = user.roles.some(
      (role) => role.name === UserRole.KEPALA_KLINIK,
    );

    if (!isKepalaKlinik && appointment.doctor_id !== user.id) {
      throw new ForbiddenException(
        'Hanya dokter yang menangani yang bisa menyelesaikan janji temu ini',
      );
    }
  }

  /**
   * Validasi status untuk update
   */
  validateStatusForUpdate(appointment: Appointment): void {
    if (appointment.status === AppointmentStatus.SELESAI) {
      throw new ConflictException(
        'Tidak bisa mengubah janji temu yang sudah selesai',
      );
    }

    if (appointment.status === AppointmentStatus.DIBATALKAN) {
      throw new ConflictException(
        'Tidak bisa mengubah janji temu yang sudah dibatalkan',
      );
    }
  }

  /**
   * Validasi appointment untuk deletion
   */
  validateForDeletion(appointment: Appointment): void {
    if (appointment.medical_record) {
      throw new ConflictException(
        'Tidak bisa menghapus janji temu yang sudah memiliki rekam medis',
      );
    }
  }

  /**
   * Cek apakah user adalah dokter (bukan kepala klinik)
   */
  isDoctorOnly(user: User): boolean {
    const isDoctor =
      user.roles?.some((role) => role.name === UserRole.DOKTER) ?? false;
    const isKepalaKlinik =
      user.roles?.some((role) => role.name === UserRole.KEPALA_KLINIK) ?? false;
    return isDoctor && !isKepalaKlinik;
  }

  /**
   * Cek apakah user adalah kepala klinik
   */
  isKepalaKlinik(user: User): boolean {
    return (
      user.roles?.some((role) => role.name === UserRole.KEPALA_KLINIK) ?? false
    );
  }
}
