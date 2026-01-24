import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateMedicalRecordDto } from '../../applications/dto/create-medical-record.dto';
import {
  Appointment,
  AppointmentStatus,
} from '../../../appointments/domains/entities/appointment.entity';
import { User } from '../../../users/domains/entities/user.entity';

/**
 * Validator for Medical Record Creation
 */
@Injectable()
export class MedicalRecordCreateValidator {
  /**
   * Validate complete creation request
   */
  validate(
    dto: CreateMedicalRecordDto | null | undefined,
    appointment: Appointment | null | undefined,
    user: User | null | undefined,
  ): void {
    if (!dto) {
      throw new BadRequestException('DTO cannot be null or undefined');
    }
    if (!appointment) {
      throw new BadRequestException('Appointment cannot be null or undefined');
    }
    if (!user) {
      throw new UnauthorizedException('User must be authenticated');
    }
    this.validateDto(dto);
    this.validateAppointment(appointment);
    this.validateSOAPFields(dto);
    this.validateBusinessRules(dto, appointment);
  }

  /**
   * Validate DTO structure
   */
  validateDto(dto: CreateMedicalRecordDto): void {
    if (!dto) {
      throw new BadRequestException('Data rekam medis harus diisi');
    }

    if (!dto.appointment_id) {
      throw new BadRequestException('ID janji temu harus diisi');
    }

    if (dto.appointment_id) {
      throw new BadRequestException('ID janji temu tidak valid');
    }

    if (!dto.user_id_staff) {
      throw new BadRequestException('ID user staff harus diisi');
    }
    if (isNaN(Number(dto.user_id_staff))) {
      throw new BadRequestException('ID user staff tidak valid');
    }
  }

  /**
   * Validate appointment
   */
  validateAppointment(appointment: Appointment): void {
    if (!appointment) {
      throw new BadRequestException('Janji temu tidak ditemukan');
    }

    if (appointment.status === AppointmentStatus.DIBATALKAN) {
      throw new BadRequestException(
        'Tidak dapat membuat rekam medis untuk janji temu yang dibatalkan',
      );
    }

    if (!appointment.patient_id) {
      throw new BadRequestException(
        'Janji temu harus memiliki pasien yang valid',
      );
    }

    if (!appointment.doctor_id) {
      throw new BadRequestException(
        'Janji temu harus memiliki dokter yang valid',
      );
    }
  }

  /**
   * Validate SOAP fields
   */
  validateSOAPFields(dto: CreateMedicalRecordDto): void {
    // Check if at least one SOAP field is provided
    const hasAnySOAPField =
      dto.subjektif || dto.objektif || dto.assessment || dto.plan;

    if (!hasAnySOAPField) {
      throw new BadRequestException(
        'Setidaknya satu field SOAP (Subjektif, Objektif, Assessment, atau Plan) harus diisi',
      );
    }

    // Validate individual field lengths
    this.validateFieldLength('Subjektif', dto.subjektif, 5000);
    this.validateFieldLength('Objektif', dto.objektif, 5000);
    this.validateFieldLength('Assessment', dto.assessment, 5000);
    this.validateFieldLength('Plan', dto.plan, 5000);

    // Validate field content
    this.validateFieldContent('Subjektif', dto.subjektif);
    this.validateFieldContent('Objektif', dto.objektif);
    this.validateFieldContent('Assessment', dto.assessment);
    this.validateFieldContent('Plan', dto.plan);
  }

  /**
   * Validate field length
   */
  private validateFieldLength(
    fieldName: string,
    value: string | undefined,
    maxLength: number,
  ): void {
    if (value && value.length > maxLength) {
      throw new BadRequestException(
        `${fieldName} tidak boleh lebih dari ${maxLength} karakter (saat ini: ${value.length})`,
      );
    }

    // Check minimum length if field is provided
    if (value && value.trim().length < 3) {
      throw new BadRequestException(
        `${fieldName} harus memiliki minimal 3 karakter`,
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
    if (!value) return;

    const trimmedValue = value.trim();

    // Check for only whitespace
    if (trimmedValue.length === 0) {
      throw new BadRequestException(
        `${fieldName} tidak boleh hanya berisi spasi`,
      );
    }

    // Check for suspicious patterns (optional)
    const suspiciousPatterns = [
      /^[.,;:!?-]+$/, // Only punctuation
      /^(\d+)$/, // Only numbers
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
   * Validate business rules
   */
  validateBusinessRules(
    dto: CreateMedicalRecordDto,
    appointment: Appointment,
  ): void {
    // Check if appointment date is not in the future
    const appointmentDate = new Date(appointment.tanggal_janji);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (appointmentDate > today) {
      throw new BadRequestException(
        'Tidak dapat membuat rekam medis untuk janji temu yang belum terjadi',
      );
    }

    // Check if appointment is not too old (configurable)
    const maxDaysOld = 365; // 1 year
    const daysDiff = Math.floor(
      (today.getTime() - appointmentDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysDiff > maxDaysOld) {
      throw new BadRequestException(
        `Tidak dapat membuat rekam medis untuk janji temu yang sudah lebih dari ${maxDaysOld} hari`,
      );
    }
  }

  /**
   * Validate SOAP completeness (all fields filled)
   */
  validateSOAPCompleteness(dto: CreateMedicalRecordDto): boolean {
    return !!(
      dto.subjektif?.trim() &&
      dto.objektif?.trim() &&
      dto.assessment?.trim() &&
      dto.plan?.trim()
    );
  }

  /**
   * Get validation warnings (non-blocking issues)
   */
  getValidationWarnings(dto: CreateMedicalRecordDto): string[] {
    const warnings: string[] = [];

    if (!dto.subjektif?.trim()) {
      warnings.push('Field Subjektif kosong');
    }
    if (!dto.objektif?.trim()) {
      warnings.push('Field Objektif kosong');
    }
    if (!dto.assessment?.trim()) {
      warnings.push('Field Assessment kosong');
    }
    if (!dto.plan?.trim()) {
      warnings.push('Field Plan kosong');
    }

    return warnings;
  }
}
