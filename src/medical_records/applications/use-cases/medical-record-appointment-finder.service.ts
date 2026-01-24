import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalRecord } from '../../domains/entities/medical-record.entity';
import { User } from '../../../users/domains/entities/user.entity';
import { MedicalRecordAuthorizationService } from '../../domains/services/medical-record-authorization.service';
import { MedicalRecordValidator } from '../../domains/validators/medical-record.validator';

@Injectable()
export class MedicalRecordAppointmentFinderService {
  private readonly logger = new Logger(
    MedicalRecordAppointmentFinderService.name,
  );

  constructor(
    @InjectRepository(MedicalRecord)
    private readonly repository: Repository<MedicalRecord>,
    private readonly authService: MedicalRecordAuthorizationService,
    private readonly validator: MedicalRecordValidator,
  ) {}

  /**
   * Find medical record by appointment ID with authorization
   */
  async execute(
    appointmentId: string,
    user: User,
  ): Promise<MedicalRecord | null> {
    // Validate input
    this.validator.validateAppointmentId(appointmentId);
    this.validator.validateUserId(user.id);

    // Find medical record with relations
    const record = await this.repository.findOne({
      where: { appointment_id: appointmentId },
      relations: [
        'appointment',
        'appointment.patient',
        'appointment.doctor',
        'appointment.doctor.roles',
        'doctor',
        'patient',
      ],
    });

    // If no record found, return null (not an error)
    if (!record) {
      this.logger.log(
        `No medical record found for appointment #${appointmentId}`,
      );
      return null;
    }

    // Validate user has permission to view this record
    this.authService.validateViewPermission(user, record);

    // Log access
    this.logger.log(
      `User ${user.id} (${this.authService.getRoleSummary(user)}) ` +
        `accessed medical record #${record.id} via appointment #${appointmentId}`,
    );

    return record;
  }

  /**
   * Check if medical record exists for appointment (without loading full data)
   */
  async exists(appointmentId: string): Promise<boolean> {
    this.validator.validateAppointmentId(appointmentId);

    const count = await this.repository.count({
      where: { appointment_id: appointmentId },
    });

    return count > 0;
  }
}
