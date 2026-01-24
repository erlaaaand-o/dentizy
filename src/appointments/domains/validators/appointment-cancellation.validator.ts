import {
  Injectable,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { User } from '../../../users/domains/entities/user.entity';
import { UserRole } from '../../../roles/entities/role.entity';

/**
 * Validator untuk pembatalan appointment
 */
@Injectable()
export class AppointmentCancellationValidator {
  private readonly CANCELLATION_BUFFER_HOURS = 24;

  /**
   * Validasi status appointment untuk pembatalan
   */
  validateStatusForCancellation(appointment: Appointment): void {
    if (appointment.status === AppointmentStatus.SELESAI) {
      throw new ConflictException(
        'Janji temu yang sudah selesai tidak bisa dibatalkan',
      );
    }

    if (appointment.status === AppointmentStatus.DIBATALKAN) {
      throw new ConflictException('Janji temu ini sudah dibatalkan sebelumnya');
    }
  }

  /**
   * Validasi pembatalan < 24 jam (hanya Kepala Klinik)
   */
  validateCancellationTiming(appointment: Appointment, user: User): void {
    const appointmentDateTime = new Date(appointment.tanggal_janji);
    const [hours, minutes] = appointment.jam_janji.split(':').map(Number);
    appointmentDateTime.setHours(hours, minutes, 0, 0);

    const now = new Date();
    const hoursDifference =
      (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    const isKepalaKlinik = user.roles.some(
      (role) => role.name === UserRole.KEPALA_KLINIK,
    );

    if (hoursDifference < this.CANCELLATION_BUFFER_HOURS && !isKepalaKlinik) {
      throw new ForbiddenException(
        `Pembatalan janji temu kurang dari ${this.CANCELLATION_BUFFER_HOURS} jam hanya bisa dilakukan oleh Kepala Klinik`,
      );
    }
  }

  /**
   * Validasi authorization untuk pembatalan
   */
  validateCancellationAuthorization(
    appointment: Appointment,
    user: User,
  ): void {
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
   * Validasi komprehensif untuk pembatalan
   */
  validateCancellation(appointment: Appointment, user: User): void {
    this.validateCancellationAuthorization(appointment, user);
    this.validateStatusForCancellation(appointment);
    this.validateCancellationTiming(appointment, user);
  }
}
