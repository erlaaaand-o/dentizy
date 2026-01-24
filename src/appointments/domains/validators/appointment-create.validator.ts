import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { User } from '../../../users/domains/entities/user.entity';
import { Patient } from '../../../patients/domains/entities/patient.entity';
import { UserRole } from '../../../roles/entities/role.entity';

/**
 * Validator untuk pembuatan appointment
 */
@Injectable()
export class AppointmentCreateValidator {
  /**
   * Validasi patient exists
   */
  validatePatientExists(patient: Patient | null, patientId: string): void {
    if (!patient) {
      throw new NotFoundException(
        `Pasien dengan ID #${patientId} tidak ditemukan`,
      );
    }
  }

  /**
   * Validasi doctor exists
   */
  validateDoctorExists(doctor: User | null, doctorId: string): void {
    if (!doctor) {
      throw new NotFoundException(
        `Dokter dengan ID #${doctorId} tidak ditemukan`,
      );
    }
  }

  /**
   * Validasi user adalah dokter atau kepala klinik
   */
  validateDoctorRole(doctor: User, doctorId: string): void {
    const isDokter =
      doctor.roles?.some((role) => role.name === UserRole.DOKTER) ?? false;
    const isKepalaKlinik =
      doctor.roles?.some((role) => role.name === UserRole.KEPALA_KLINIK) ??
      false;

    if (!isDokter && !isKepalaKlinik) {
      throw new ForbiddenException(
        `User dengan ID #${doctorId} bukan dokter atau kepala klinik`,
      );
    }
  }

  /**
   * Validasi komprehensif untuk create appointment
   */
  validateCreateAppointment(
    patient: Patient | null,
    patientId: string,
    doctor: User | null,
    doctorId: string,
  ): void {
    this.validatePatientExists(patient, patientId);
    this.validateDoctorExists(doctor, doctorId);
    this.validateDoctorRole(doctor!, doctorId);
  }
}
