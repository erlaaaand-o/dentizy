import {
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '../../../users/domains/entities/user.entity';
import { MedicalRecord } from '../entities/medical-record.entity';
import { Appointment } from '../../../appointments/domains/entities/appointment.entity';
import { UserRole } from '../../../roles/entities/role.entity';

/**
 * Authorization Validator for Medical Records
 * Validates user permissions for various operations
 */
@Injectable()
export class MedicalRecordAuthorizationValidator {
  /**
   * Validate user is authenticated
   */
  validateAuthenticated(user: User | null | undefined): void {
    if (!user || !user.id) {
      throw new UnauthorizedException('User tidak terautentikasi');
    }

    if (!user.roles || user.roles.length === 0) {
      throw new UnauthorizedException('User tidak memiliki role yang valid');
    }
  }

  /**
   * Validate user has required role
   */
  validateHasRole(user: User, requiredRoles: UserRole[]): void {
    this.validateAuthenticated(user);

    const userRoles = user.roles.map((r) => r.name);
    const hasRequiredRole = requiredRoles.some((role) =>
      userRoles.includes(role),
    );

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `User harus memiliki salah satu role: ${requiredRoles.join(', ')}`,
      );
    }
  }

  /**
   * Validate user can create medical record
   */
  validateCanCreate(user: User, appointment: Appointment): void {
    this.validateAuthenticated(user);

    const userRoles = user.roles.map((r) => r.name);

    // Kepala Klinik: can create for any appointment
    if (userRoles.includes(UserRole.KEPALA_KLINIK)) {
      return;
    }

    // Dokter: can only create for their own appointments
    if (userRoles.includes(UserRole.DOKTER)) {
      if (appointment.doctor_id !== user.id) {
        throw new ForbiddenException(
          'Dokter hanya dapat membuat rekam medis untuk pasien mereka sendiri',
        );
      }
      return;
    }

    // Staf: can create records (with supervision)
    if (userRoles.includes(UserRole.STAF)) {
      return;
    }

    // No valid role
    throw new ForbiddenException(
      'Anda tidak memiliki izin untuk membuat rekam medis',
    );
  }

  /**
   * Validate user can view medical record
   */
  validateCanView(user: User, record: MedicalRecord): void {
    this.validateAuthenticated(user);

    const userRoles = user.roles.map((r) => r.name);

    // Kepala Klinik: can view all
    if (userRoles.includes(UserRole.KEPALA_KLINIK)) {
      return;
    }

    // Dokter: can view if they are the doctor or creator
    if (userRoles.includes(UserRole.DOKTER)) {
      const isDoctor = record.appointment?.doctor_id === user.id;
      const isCreator = record.doctor_id === user.id;

      if (isDoctor || isCreator) {
        return;
      }

      throw new ForbiddenException(
        'Dokter hanya dapat melihat rekam medis pasien mereka sendiri',
      );
    }

    // Staf: can view all non-cancelled records
    if (userRoles.includes(UserRole.STAF)) {
      return;
    }

    throw new ForbiddenException(
      'Anda tidak memiliki izin untuk melihat rekam medis ini',
    );
  }

  /**
   * Validate user can update medical record
   */
  validateCanUpdate(user: User, record: MedicalRecord): void {
    this.validateAuthenticated(user);

    const userRoles = user.roles.map((r) => r.name);

    // Kepala Klinik: can update any record
    if (userRoles.includes(UserRole.KEPALA_KLINIK)) {
      return;
    }

    const isCreator = record.doctor_id === user.id;
    const isAppointmentDoctor = record.appointment?.doctor_id === user.id;

    // Dokter: can update if creator or appointment doctor
    if (userRoles.includes(UserRole.DOKTER)) {
      if (isCreator || isAppointmentDoctor) {
        return;
      }

      throw new ForbiddenException(
        'Dokter hanya dapat mengubah rekam medis yang mereka buat atau untuk pasien mereka',
      );
    }

    // Staf: can only update what they created
    if (userRoles.includes(UserRole.STAF)) {
      if (isCreator) {
        return;
      }

      throw new ForbiddenException(
        'Staf hanya dapat mengubah rekam medis yang mereka buat',
      );
    }

    throw new ForbiddenException(
      'Anda tidak memiliki izin untuk mengubah rekam medis ini',
    );
  }

  /**
   * Validate user can delete medical record
   */
  validateCanDelete(user: User): void {
    this.validateAuthenticated(user);

    const userRoles = user.roles.map((r) => r.name);

    // Only Kepala Klinik can delete
    if (!userRoles.includes(UserRole.KEPALA_KLINIK)) {
      throw new ForbiddenException(
        'Hanya Kepala Klinik yang dapat menghapus rekam medis',
      );
    }
  }

  /**
   * Validate user can restore medical record
   */
  validateCanRestore(user: User): void {
    this.validateAuthenticated(user);

    const userRoles = user.roles.map((r) => r.name);

    // Only Kepala Klinik can restore
    if (!userRoles.includes(UserRole.KEPALA_KLINIK)) {
      throw new ForbiddenException(
        'Hanya Kepala Klinik yang dapat mengembalikan rekam medis yang dihapus',
      );
    }
  }

  /**
   * Validate user can perform hard delete (permanent)
   */
  validateCanHardDelete(user: User): void {
    this.validateAuthenticated(user);

    const userRoles = user.roles.map((r) => r.name);

    // Only Kepala Klinik can hard delete
    if (!userRoles.includes(UserRole.KEPALA_KLINIK)) {
      throw new ForbiddenException(
        'Hanya Kepala Klinik yang dapat menghapus permanen rekam medis',
      );
    }

    // Additional security check: require explicit permission flag
    // This is a placeholder for future implementation
    // Could check additional permission flags, IP whitelist, etc.
  }

  /**
   * Validate user can access patient records
   */
  validateCanAccessPatientRecords(user: User, patientId: number): void {
    this.validateAuthenticated(user);

    const userRoles = user.roles.map((r) => r.name);

    // Kepala Klinik: can access all patient records
    if (userRoles.includes(UserRole.KEPALA_KLINIK)) {
      return;
    }

    // Staf: can access all patient records (for administrative purposes)
    if (userRoles.includes(UserRole.STAF)) {
      return;
    }

    // Dokter: needs additional validation (check if patient is theirs)
    // This would require querying appointments or medical records
    if (userRoles.includes(UserRole.DOKTER)) {
      // TODO: Check if doctor has treated this patient
      // For now, allow access (will be filtered by authorization service)
      return;
    }

    throw new ForbiddenException(
      'Anda tidak memiliki izin untuk mengakses rekam medis pasien ini',
    );
  }

  /**
   * Validate bulk operations
   */
  validateCanPerformBulkOperation(user: User): void {
    this.validateAuthenticated(user);

    const userRoles = user.roles.map((r) => r.name);

    // Only Kepala Klinik and Staf can perform bulk operations
    if (
      !userRoles.includes(UserRole.KEPALA_KLINIK) &&
      !userRoles.includes(UserRole.STAF)
    ) {
      throw new ForbiddenException(
        'Anda tidak memiliki izin untuk melakukan operasi massal',
      );
    }
  }

  /**
   * Get authorization level for user
   */
  getAuthorizationLevel(user: User): 'admin' | 'doctor' | 'staff' | 'none' {
    this.validateAuthenticated(user);

    const userRoles = user.roles.map((r) => r.name);

    if (userRoles.includes(UserRole.KEPALA_KLINIK)) {
      return 'admin';
    }

    if (userRoles.includes(UserRole.DOKTER)) {
      return 'doctor';
    }

    if (userRoles.includes(UserRole.STAF)) {
      return 'staff';
    }

    return 'none';
  }

  /**
   * Check if user can access statistics
   */
  validateCanAccessStatistics(user: User): void {
    this.validateAuthenticated(user);

    const userRoles = user.roles.map((r) => r.name);

    // Kepala Klinik and Staf can access statistics
    if (
      !userRoles.includes(UserRole.KEPALA_KLINIK) &&
      !userRoles.includes(UserRole.STAF)
    ) {
      throw new ForbiddenException(
        'Anda tidak memiliki izin untuk mengakses statistik',
      );
    }
  }

  /**
   * Validate cross-clinic access (if multiple clinics)
   */
  validateClinicAccess(user: User, clinicId?: number): void {
    this.validateAuthenticated(user);

    // TODO: Implement multi-clinic validation
    // For now, assume single clinic
  }

  /**
   * Get allowed operations for user
   */
  getAllowedOperations(user: User, record?: MedicalRecord): string[] {
    const operations: string[] = [];
    const userRoles = user.roles.map((r) => r.name);

    if (userRoles.includes(UserRole.KEPALA_KLINIK)) {
      return [
        'create',
        'read',
        'update',
        'delete',
        'restore',
        'hard_delete',
        'bulk',
      ];
    }

    if (userRoles.includes(UserRole.DOKTER)) {
      operations.push('create', 'read');

      if (record) {
        const isCreator = record.doctor_id === user.id;
        const isAppointmentDoctor = record.appointment?.doctor_id === user.id;

        if (isCreator || isAppointmentDoctor) {
          operations.push('update');
        }
      } else {
        operations.push('update'); // Assume can update own records
      }
    }

    if (userRoles.includes(UserRole.STAF)) {
      operations.push('create', 'read');

      if (record) {
        const isCreator = record.doctor_id === user.id;
        if (isCreator) {
          operations.push('update');
        }
      } else {
        operations.push('update'); // Assume can update own records
      }
    }

    return operations;
  }
}
