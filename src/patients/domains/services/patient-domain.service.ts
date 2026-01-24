import { Injectable } from '@nestjs/common';
import { Patient } from '../entities/patient.entity';

/**
 * Domain Service - Business logic yang tidak cocok di entity
 * Mengandung logic yang melibatkan multiple entities atau complex domain rules
 */
@Injectable()
export class PatientDomainService {
  /**
   * Check if patient is eligible for appointment
   */
  isEligibleForAppointment(patient: Patient): boolean {
    // UPDATE: Izinkan jika pasien tidak aktif TAPI terdaftar online (kasus belum verifikasi)
    if (!patient.is_active && !patient.is_registered_online) {
      return false;
    }

    // Business rule: Patient harus punya kontak
    if (!patient.email && !patient.no_hp) {
      return false;
    }

    return true;
  }

  /**
   * Check if patient can be deleted
   */
  canBeDeleted(patient: Patient): { allowed: boolean; reason?: string } {
    // Business rule: Tidak bisa hapus jika ada appointment aktif
    const hasActiveAppointments = patient.appointments?.some((app) =>
      ['dijadwalkan', 'sedang_berlangsung'].includes(app.status),
    );

    if (hasActiveAppointments) {
      return {
        allowed: false,
        reason: 'Pasien memiliki janji temu aktif',
      };
    }

    return { allowed: true };
  }

  /**
   * Calculate patient age with precision
   */
  calculateAge(birthDate: Date | null): number | null {
    if (!birthDate) return null;

    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age >= 0 ? age : null;
  }

  /**
   * Check if patient is a minor (under 18)
   */
  isMinor(patient: Patient): boolean {
    const age = this.calculateAge(patient.tanggal_lahir);
    return age !== null && age < 18;
  }

  /**
   * Check if patient is senior (65+)
   */
  isSenior(patient: Patient): boolean {
    const age = this.calculateAge(patient.tanggal_lahir);
    return age !== null && age >= 65;
  }

  /**
   * Check if patient is new (registered in last 30 days)
   */
  isNewPatient(createdAt: Date): boolean {
    if (!createdAt) return false;

    const daysSinceCreation = Math.floor(
      (new Date().getTime() - new Date(createdAt).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    return daysSinceCreation <= 30;
  }

  /**
   * Format full patient display name with medical record number
   */
  getFullDisplayName(patient: Patient): string {
    return `${patient.nama_lengkap} (${patient.nomor_rekam_medis})`;
  }

  /**
   * Check if patient needs updated contact information
   */
  needsContactUpdate(patient: Patient): boolean {
    return !patient.email && !patient.no_hp;
  }

  /**
   * Validate if patient data is complete for medical procedures
   */
  isDataCompleteForProcedure(patient: Patient): {
    complete: boolean;
    missing: string[];
  } {
    const missing: string[] = [];

    if (!patient.tanggal_lahir) missing.push('tanggal_lahir');
    if (!patient.jenis_kelamin) missing.push('jenis_kelamin');
    if (!patient.alamat) missing.push('alamat');
    if (!patient.email && !patient.no_hp) missing.push('kontak');

    return {
      complete: missing.length === 0,
      missing,
    };
  }

  /**
   * Get age category for statistics
   */
  getAgeCategory(
    patient: Patient,
  ): 'child' | 'teen' | 'adult' | 'senior' | 'unknown' {
    const age = this.calculateAge(patient.tanggal_lahir);

    if (age === null) return 'unknown';
    if (age < 13) return 'child';
    if (age < 18) return 'teen';
    if (age < 65) return 'adult';
    return 'senior';
  }
}
