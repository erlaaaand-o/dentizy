// domains/services/medical-record-authorization.service.ts
import { Injectable, ForbiddenException } from '@nestjs/common';
import { User } from '../../../users/domains/entities/user.entity';
import { MedicalRecord } from './../entities/medical-record.entity';
import { Appointment } from '../../../appointments/domains/entities/appointment.entity';
import { UserRole } from '../../../roles/entities/role.entity';

interface AccessFilter {
  field: string;
  value: string;
  operator: 'eq' | 'in' | 'ne';
}

@Injectable()
export class MedicalRecordAuthorizationService {
  /**
   * Check if user has a specific role
   */
  private hasRole(user: User, roleName: UserRole): boolean {
    return user.roles.some((role) => role.name === roleName);
  }

  /**
   * Check if user is Kepala Klinik (has full access)
   */
  isKepalaKlinik(user: User): boolean {
    return this.hasRole(user, UserRole.KEPALA_KLINIK);
  }

  /**
   * Check if user is Dokter
   */
  isDokter(user: User): boolean {
    return this.hasRole(user, UserRole.DOKTER);
  }

  /**
   * Check if user is Staf
   */
  isStaf(user: User): boolean {
    return this.hasRole(user, UserRole.STAF);
  }

  /**
   * Check if user can create medical record for an appointment
   */
  canCreate(user: User, appointment: Appointment): boolean {
    // Kepala Klinik can create any record
    if (this.isKepalaKlinik(user)) {
      return true;
    }

    // Dokter can only create for their own appointments
    if (this.isDokter(user)) {
      return appointment.doctor_id === user.id;
    }

    // Staf can create records
    if (this.isStaf(user)) {
      return true;
    }

    return false;
  }

  /**
   * Validate creation permission and throw if not allowed
   */
  validateCreatePermission(user: User, appointment: Appointment): void {
    if (!this.canCreate(user, appointment)) {
      throw new ForbiddenException(
        'Anda tidak berhak mengisi rekam medis untuk janji temu ini.',
      );
    }
  }

  /**
   * Check if user can view a medical record
   */
  canView(user: User, medicalRecord: MedicalRecord): boolean {
    // Kepala Klinik can view all
    if (this.isKepalaKlinik(user)) {
      return true;
    }

    // Dokter can view if they are the doctor or creator
    if (this.isDokter(user)) {
      const isDoctor = medicalRecord.appointment?.doctor_id === user.id;
      const isCreator = medicalRecord.doctor_id === user.id;
      return isDoctor || isCreator;
    }

    // Staf can view if they created it or appointment is not cancelled
    if (this.isStaf(user)) {
      return true; // Staf has broad access for administrative purposes
    }

    return false;
  }

  /**
   * Validate view permission and throw if not allowed
   */
  validateViewPermission(user: User, medicalRecord: MedicalRecord): void {
    if (!this.canView(user, medicalRecord)) {
      throw new ForbiddenException(
        'Anda tidak memiliki akses ke rekam medis ini',
      );
    }
  }

  /**
   * Check if user can update a medical record
   */
  canUpdate(user: User, medicalRecord: MedicalRecord): boolean {
    // Kepala Klinik can update any record
    if (this.isKepalaKlinik(user)) {
      return true;
    }

    const isCreator = medicalRecord.doctor_id === user.id;
    const isAppointmentDoctor =
      medicalRecord.appointment?.doctor_id === user.id;

    // Dokter can update if they are creator or appointment doctor
    if (this.isDokter(user)) {
      return isCreator || isAppointmentDoctor;
    }

    // Staf can only update what they created
    if (this.isStaf(user)) {
      return isCreator;
    }

    return false;
  }

  /**
   * Validate update permission and throw if not allowed
   */
  validateUpdatePermission(user: User, medicalRecord: MedicalRecord): void {
    if (!this.canUpdate(user, medicalRecord)) {
      const isDokter = this.isDokter(user);
      const message = isDokter
        ? 'Anda hanya bisa mengubah rekam medis yang Anda buat atau dari pasien Anda'
        : 'Anda hanya bisa mengubah rekam medis yang Anda buat';

      throw new ForbiddenException(message);
    }
  }

  /**
   * Check if user can delete a medical record
   */
  canDelete(user: User): boolean {
    // Only Kepala Klinik can delete
    return this.isKepalaKlinik(user);
  }

  /**
   * Validate delete permission and throw if not allowed
   */
  validateDeletePermission(user: User): void {
    if (!this.canDelete(user)) {
      throw new ForbiddenException(
        'Hanya Kepala Klinik yang dapat menghapus rekam medis',
      );
    }
  }

  /**
   * Get WHERE clause for findAll based on user role
   */
  getAccessFilter(user: User): AccessFilter | null {
    // Kepala Klinik: no filter, can see all
    if (this.isKepalaKlinik(user)) {
      return null;
    }

    // Dokter: filter by doctor_id or creator
    if (this.isDokter(user)) {
      return {
        field: 'doctor_or_creator',
        value: user.id,
        operator: 'eq',
      };
    }

    // Staf: can see all active records
    if (this.isStaf(user)) {
      return null; // Staf has broad access
    }

    // Default: no access
    return {
      field: 'id',
      value: '00000000-0000-0000-0000-000000000000',
      operator: 'eq',
    };
  }

  /**
   * Get user role summary for logging
   */
  getRoleSummary(user: User): string {
    return user.roles.map((r) => r.name.toUpperCase()).join(', ');
  }
}
