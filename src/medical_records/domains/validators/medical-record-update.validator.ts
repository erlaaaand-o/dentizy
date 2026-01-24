import { Injectable, BadRequestException } from '@nestjs/common';
import { UpdateMedicalRecordDto } from '../../applications/dto/update-medical-record.dto';
import { MedicalRecord } from '../entities/medical-record.entity';
import { AppointmentStatus } from '../../../appointments/domains/entities/appointment.entity';

/**
 * Validator for Medical Record Update
 */
@Injectable()
export class MedicalRecordUpdateValidator {
  /**
   * Validate complete update request
   */
  validate(dto: UpdateMedicalRecordDto, existingRecord: MedicalRecord): void {
    this.validateDto(dto);
    this.validateSOAPFields(dto);
    this.validateExistingRecord(existingRecord);
    this.validateBusinessRules(dto, existingRecord);
  }

  /**
   * Validate DTO structure
   */
  validateDto(dto: UpdateMedicalRecordDto): void {
    if (!dto) {
      throw new BadRequestException('Data update harus diisi');
    }

    // Check if at least one field is being updated
    const hasUpdates =
      dto.subjektif !== undefined ||
      dto.objektif !== undefined ||
      dto.assessment !== undefined ||
      dto.plan !== undefined;

    if (!hasUpdates) {
      throw new BadRequestException(
        'Setidaknya satu field harus diisi untuk update',
      );
    }
  }

  /**
   * Validate SOAP fields
   */
  validateSOAPFields(dto: UpdateMedicalRecordDto): void {
    // Validate individual field lengths
    this.validateFieldLength('Subjektif', dto.subjektif ?? undefined, 5000);
    this.validateFieldLength('Objektif', dto.objektif ?? undefined, 5000);
    this.validateFieldLength('Assessment', dto.assessment ?? undefined, 5000);
    this.validateFieldLength('Plan', dto.plan ?? undefined, 5000);

    // Validate field content
    if (dto.subjektif !== undefined) {
      this.validateFieldContent('Subjektif', dto.subjektif ?? undefined);
    }
    if (dto.objektif !== undefined) {
      this.validateFieldContent('Objektif', dto.objektif ?? undefined);
    }
    if (dto.assessment !== undefined) {
      this.validateFieldContent('Assessment', dto.assessment ?? undefined);
    }
    if (dto.plan !== undefined) {
      this.validateFieldContent('Plan', dto.plan ?? undefined);
    }
  }

  /**
   * Validate field length
   */
  private validateFieldLength(
    fieldName: string,
    value: string | undefined,
    maxLength: number,
  ): void {
    if (value === undefined) return;

    if (value && value.length > maxLength) {
      throw new BadRequestException(
        `${fieldName} tidak boleh lebih dari ${maxLength} karakter (saat ini: ${value.length})`,
      );
    }

    // Allow empty string to clear field, but not only whitespace
    if (value && value.trim().length > 0 && value.trim().length < 3) {
      throw new BadRequestException(
        `${fieldName} harus memiliki minimal 3 karakter atau kosong`,
      );
    }
  }

  /**
   * Validate field content
   */
  private validateFieldContent(
    fieldName: string,
    value: string | undefined,
  ): void {
    if (value === undefined || value === null) return;

    // Allow empty string to clear field
    if (value === '') return;

    const trimmedValue = value.trim();

    // If not empty, must have valid content
    if (trimmedValue.length === 0) {
      throw new BadRequestException(
        `${fieldName} tidak boleh hanya berisi spasi`,
      );
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /^[.,;:!?-]+$/, // Only punctuation
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(trimmedValue)) {
        throw new BadRequestException(
          `${fieldName} harus berisi teks yang valid`,
        );
      }
    }
  }

  /**
   * Validate existing record
   */
  validateExistingRecord(record: MedicalRecord): void {
    if (!record) {
      throw new BadRequestException('Rekam medis tidak ditemukan');
    }

    if (!record.appointment) {
      throw new BadRequestException(
        'Rekam medis harus memiliki relasi appointment yang valid',
      );
    }

    // Check if appointment is cancelled
    if (record.appointment.status === AppointmentStatus.DIBATALKAN) {
      throw new BadRequestException(
        'Tidak dapat mengubah rekam medis dari janji temu yang dibatalkan',
      );
    }

    // Check if record is deleted
    if (record.deleted_at) {
      throw new BadRequestException(
        'Tidak dapat mengubah rekam medis yang sudah dihapus',
      );
    }
  }

  /**
   * Validate business rules
   */
  validateBusinessRules(
    dto: UpdateMedicalRecordDto,
    record: MedicalRecord,
  ): void {
    // Check if trying to clear all fields (not recommended)
    const wouldBeEmpty = this.wouldAllFieldsBeEmpty(dto, record);
    if (wouldBeEmpty) {
      throw new BadRequestException(
        'Tidak dapat mengosongkan semua field SOAP. Minimal satu field harus tetap terisi.',
      );
    }

    // Check record age (optional - prevent editing very old records)
    const maxEditDays = 90; // 3 months
    const recordAge = this.calculateRecordAge(record.created_at);

    if (recordAge > maxEditDays) {
      throw new BadRequestException(
        `Rekam medis yang sudah lebih dari ${maxEditDays} hari tidak dapat diubah`,
      );
    }
  }

  /**
   * Check if update would result in all fields being empty
   */
  private wouldAllFieldsBeEmpty(
    dto: UpdateMedicalRecordDto,
    record: MedicalRecord,
  ): boolean {
    const newSubjektif =
      dto.subjektif !== undefined ? dto.subjektif : record.subjektif;
    const newObjektif =
      dto.objektif !== undefined ? dto.objektif : record.objektif;
    const newAssessment =
      dto.assessment !== undefined ? dto.assessment : record.assessment;
    const newPlan = dto.plan !== undefined ? dto.plan : record.plan;

    return !(
      newSubjektif?.trim() ||
      newObjektif?.trim() ||
      newAssessment?.trim() ||
      newPlan?.trim()
    );
  }

  /**
   * Calculate record age in days
   */
  private calculateRecordAge(createdAt: Date): number {
    const today = new Date();
    const created = new Date(createdAt);
    const diffMs = today.getTime() - created.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Validate that update actually changes something
   */
  validateHasChanges(
    dto: UpdateMedicalRecordDto,
    existing: MedicalRecord,
  ): void {
    let hasChanges = false;

    if (dto.subjektif !== undefined && dto.subjektif !== existing.subjektif) {
      hasChanges = true;
    }
    if (dto.objektif !== undefined && dto.objektif !== existing.objektif) {
      hasChanges = true;
    }
    if (
      dto.assessment !== undefined &&
      dto.assessment !== existing.assessment
    ) {
      hasChanges = true;
    }
    if (dto.plan !== undefined && dto.plan !== existing.plan) {
      hasChanges = true;
    }

    if (!hasChanges) {
      throw new BadRequestException('Tidak ada perubahan yang dilakukan');
    }
  }

  /**
   * Get list of fields being updated
   */
  getUpdatedFields(dto: UpdateMedicalRecordDto): string[] {
    const fields: string[] = [];

    if (dto.subjektif !== undefined) fields.push('subjektif');
    if (dto.objektif !== undefined) fields.push('objektif');
    if (dto.assessment !== undefined) fields.push('assessment');
    if (dto.plan !== undefined) fields.push('plan');

    return fields;
  }

  /**
   * Get validation warnings
   */
  getValidationWarnings(
    dto: UpdateMedicalRecordDto,
    record: MedicalRecord,
  ): string[] {
    const warnings: string[] = [];

    // Warn if clearing important fields
    if (dto.subjektif === '' && record.subjektif) {
      warnings.push('Field Subjektif akan dikosongkan');
    }
    if (dto.objektif === '' && record.objektif) {
      warnings.push('Field Objektif akan dikosongkan');
    }
    if (dto.assessment === '' && record.assessment) {
      warnings.push('Field Assessment akan dikosongkan');
    }
    if (dto.plan === '' && record.plan) {
      warnings.push('Field Plan akan dikosongkan');
    }

    // Warn if record is old
    const recordAge = this.calculateRecordAge(record.created_at);
    if (recordAge >= 30) {
      warnings.push(`Rekam medis ini sudah berumur ${recordAge} hari`);
    }

    return warnings;
  }

  /**
   * Check if update will make record complete
   */
  willBeComplete(dto: UpdateMedicalRecordDto, record: MedicalRecord): boolean {
    const newSubjektif =
      dto.subjektif !== undefined ? dto.subjektif : record.subjektif;
    const newObjektif =
      dto.objektif !== undefined ? dto.objektif : record.objektif;
    const newAssessment =
      dto.assessment !== undefined ? dto.assessment : record.assessment;
    const newPlan = dto.plan !== undefined ? dto.plan : record.plan;

    return !!(
      newSubjektif?.trim() &&
      newObjektif?.trim() &&
      newAssessment?.trim() &&
      newPlan?.trim()
    );
  }
}
