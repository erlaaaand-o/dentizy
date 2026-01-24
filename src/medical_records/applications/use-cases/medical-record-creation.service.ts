import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { MedicalRecord } from '../../domains/entities/medical-record.entity';
import {
  Appointment,
  AppointmentStatus,
} from '../../../appointments/domains/entities/appointment.entity';
import { CreateMedicalRecordDto } from '../dto/create-medical-record.dto';
import { User } from '../../../users/domains/entities/user.entity';
import { MedicalRecordMapper } from '../../domains/mappers/medical-record.mappers';
import { MedicalRecordDomainService } from '../../domains/services/medical-record-domain.service';
import { MedicalRecordAuthorizationService } from '../../domains/services/medical-record-authorization.service';
import { MedicalRecordValidator } from '../../domains/validators/medical-record.validator';

@Injectable()
export class MedicalRecordCreationService {
  private readonly logger = new Logger(MedicalRecordCreationService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly mapper: MedicalRecordMapper,
    private readonly domainService: MedicalRecordDomainService,
    private readonly authService: MedicalRecordAuthorizationService,
    private readonly validator: MedicalRecordValidator,
  ) {}

  /**
   * Create new medical record with transaction
   */
  async execute(
    dto: CreateMedicalRecordDto,
    user: User,
  ): Promise<MedicalRecord> {
    // Validate input
    this.validator.validateAppointmentId(dto.appointment_id);
    this.validator.validateUserId(user.id);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Fetch appointment with relations
      const appointment = await this.fetchAppointment(
        queryRunner.manager,
        dto.appointment_id,
      );

      // 2. Validate appointment exists
      if (!appointment) {
        throw new NotFoundException(
          `Janji temu dengan ID #${dto.appointment_id} tidak ditemukan`,
        );
      }

      // 3. Validate appointment eligibility
      this.domainService.validateAppointmentEligibility(appointment);

      // 4. Check authorization
      this.authService.validateCreatePermission(user, appointment);

      // 5. Check for existing medical record
      const existingRecord = await this.checkExistingRecord(
        queryRunner.manager,
        dto.appointment_id,
      );
      this.domainService.validateNoExistingRecord(existingRecord);

      // 6. Map DTO to entity
      const entityData = this.mapper.toEntity(dto, user.id);
      entityData.patient_id = appointment.patient_id;

      // 7. Validate SOAP fields
      this.domainService.validateAllSOAPFields(entityData);

      // 8. Create and save medical record
      const newRecord = queryRunner.manager.create(MedicalRecord, entityData);
      const savedRecord = await queryRunner.manager.save(
        MedicalRecord,
        newRecord,
      );

      // 9. Update appointment status to SELESAI
      if (this.domainService.shouldUpdateAppointmentStatus(appointment)) {
        await this.updateAppointmentStatus(queryRunner.manager, appointment);
      }

      // 10. Commit transaction
      await queryRunner.commitTransaction();

      // 11. Log success
      this.logger.log(
        `Medical record #${savedRecord.id} created by user #${user.id} ` +
          `for appointment #${appointment.id}`,
      );

      // 12. Load relations and return
      return await this.loadRecordWithRelations(savedRecord.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();

      this.logger.error(
        `Failed to create medical record: ${error.message}`,
        error.stack,
      );

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Fetch appointment with necessary relations
   */
  private async fetchAppointment(
    manager: EntityManager,
    appointmentId: string,
  ): Promise<Appointment | null> {
    return await manager.findOne(Appointment, {
      where: { id: appointmentId },
      relations: ['doctor', 'patient'],
    });
  }

  /**
   * Check if medical record already exists for appointment
   */
  private async checkExistingRecord(
    manager: EntityManager,
    appointmentId: string,
  ): Promise<MedicalRecord | null> {
    return await manager.findOne(MedicalRecord, {
      where: { appointment_id: appointmentId },
    });
  }

  /**
   * Update appointment status to SELESAI
   */
  private async updateAppointmentStatus(
    manager: EntityManager,
    appointment: Appointment,
  ): Promise<void> {
    appointment.status = AppointmentStatus.SELESAI;
    await manager.save(Appointment, appointment);

    this.logger.log(`Appointment #${appointment.id} status updated to SELESAI`);
  }

  /**
   * Load medical record with all relations
   */
  private async loadRecordWithRelations(id: string): Promise<MedicalRecord> {
    const record = await this.dataSource.manager.findOne(MedicalRecord, {
      where: { id },
      relations: [
        'appointment',
        'appointment.patient',
        'appointment.doctor',
        'doctor',
        'patient',
      ],
    });

    this.validator.validateExists(record);
    return record!;
  }
}
