import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { MedicalRecord } from './../entities/medical-record.entity';
import {
  Appointment,
  AppointmentStatus,
} from '../../../appointments/domains/entities/appointment.entity';

@Injectable()
export class MedicalRecordDomainService {
  /**
   * Validate if SOAP notes have minimum content
   */
  validateSOAPContent(medicalRecord: Partial<MedicalRecord>): void {
    const { subjektif, objektif, assessment, plan } = medicalRecord;

    const hasAnyContent = subjektif || objektif || assessment || plan;

    if (!hasAnyContent) {
      throw new BadRequestException(
        'Rekam medis harus memiliki setidaknya satu field SOAP yang diisi',
      );
    }
  }

  /**
   * Validate appointment is eligible for medical record creation
   */
  validateAppointmentEligibility(
    appointment: Appointment | undefined | null,
  ): void {
    if (!appointment) {
      throw new BadRequestException('Appointment tidak ditemukan');
    }

    if (appointment.status === AppointmentStatus.DIBATALKAN) {
      throw new ConflictException(
        'Rekam medis tidak bisa dibuat untuk janji temu yang dibatalkan',
      );
    }
  }

  /**
   * Validate appointment is eligible for medical record update
   */
  validateAppointmentForUpdate(appointment: Appointment): void {
    if (appointment.status === AppointmentStatus.DIBATALKAN) {
      throw new ConflictException(
        'Tidak dapat mengubah rekam medis dari janji temu yang dibatalkan',
      );
    }
  }

  /**
   * Check if medical record already exists for appointment
   */
  validateNoExistingRecord(existingRecord: MedicalRecord | null): void {
    if (existingRecord) {
      throw new ConflictException('Janji temu ini sudah memiliki rekam medis');
    }
  }

  /**
   * Calculate age of medical record in days
   */
  calculateRecordAge(createdAt: Date): number {
    const today = new Date();
    const created = new Date(createdAt);
    const diffMs = today.getTime() - created.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Determine if appointment status should be updated to SELESAI
   */
  shouldUpdateAppointmentStatus(appointment: Appointment): boolean {
    return appointment.status !== AppointmentStatus.SELESAI;
  }

  /**
   * Normalize SOAP text fields (trim whitespace)
   */
  normalizeSOAPFields(data: Partial<MedicalRecord>): Partial<MedicalRecord> {
    const normalized = { ...data };

    if (normalized.subjektif) {
      normalized.subjektif = normalized.subjektif.trim();
    }
    if (normalized.objektif) {
      normalized.objektif = normalized.objektif.trim();
    }
    if (normalized.assessment) {
      normalized.assessment = normalized.assessment.trim();
    }
    if (normalized.plan) {
      normalized.plan = normalized.plan.trim();
    }

    return normalized;
  }

  /**
   * Validate SOAP field length
   */
  validateSOAPFieldLength(
    fieldName: string,
    value: string,
    maxLength: number = 5000,
  ): void {
    if (value && value.length > maxLength) {
      throw new BadRequestException(
        `${fieldName} maksimal ${maxLength} karakter`,
      );
    }
  }

  /**
   * Validate all SOAP fields length
   */
  validateAllSOAPFields(data: Partial<MedicalRecord>): void {
    if (data.subjektif) {
      this.validateSOAPFieldLength('Subjektif', data.subjektif);
    }
    if (data.objektif) {
      this.validateSOAPFieldLength('Objektif', data.objektif);
    }
    if (data.assessment) {
      this.validateSOAPFieldLength('Assessment', data.assessment);
    }
    if (data.plan) {
      this.validateSOAPFieldLength('Plan', data.plan);
    }
  }

  /**
   * Check if medical record is complete (all SOAP fields filled)
   */
  isRecordComplete(medicalRecord: MedicalRecord): boolean {
    return !!(
      medicalRecord.subjektif &&
      medicalRecord.objektif &&
      medicalRecord.assessment &&
      medicalRecord.plan
    );
  }

  /**
   * Calculate completion percentage
   */
  getCompletionPercentage(medicalRecord: MedicalRecord): number {
    let filledFields = 0;
    const totalFields = 4;

    if (medicalRecord.subjektif?.trim()) filledFields++;
    if (medicalRecord.objektif?.trim()) filledFields++;
    if (medicalRecord.assessment?.trim()) filledFields++;
    if (medicalRecord.plan?.trim()) filledFields++;

    return Math.round((filledFields / totalFields) * 100);
  }

  /**
   * Validate that at least one field is being updated
   */
  validateUpdateHasChanges(updateData: Partial<MedicalRecord>): void {
    const hasChanges = Object.keys(updateData).length > 0;

    if (!hasChanges) {
      throw new BadRequestException('Tidak ada perubahan yang dilakukan');
    }
  }

  /**
   * Merge update data with existing record
   */
  mergeUpdateData(
    existing: MedicalRecord,
    updates: Partial<MedicalRecord>,
  ): MedicalRecord {
    return Object.assign(existing, this.normalizeSOAPFields(updates));
  }
}
