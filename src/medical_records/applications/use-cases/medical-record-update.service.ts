import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { MedicalRecord } from '../../domains/entities/medical-record.entity';
import {
  Appointment,
  AppointmentStatus,
} from '../../../appointments/domains/entities/appointment.entity';
import { UpdateMedicalRecordDto } from '../dto/update-medical-record.dto';
import { User } from '../../../users/domains/entities/user.entity';
import { MedicalRecordMapper } from '../../domains/mappers/medical-record.mappers';
import { MedicalRecordDomainService } from '../../domains/services/medical-record-domain.service';
import { MedicalRecordAuthorizationService } from '../../domains/services/medical-record-authorization.service';
import { MedicalRecordValidator } from '../../domains/validators/medical-record.validator';

@Injectable()
export class MedicalRecordUpdateService {
  private readonly logger = new Logger(MedicalRecordUpdateService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly mapper: MedicalRecordMapper,
    private readonly domainService: MedicalRecordDomainService,
    private readonly authService: MedicalRecordAuthorizationService,
    private readonly validator: MedicalRecordValidator,
  ) {}

  /**
   * Update medical record with transaction
   */
  async execute(
    id: string,
    dto: UpdateMedicalRecordDto,
    user: User,
  ): Promise<MedicalRecord> {
    // Validate input
    this.validator.validateId(id);
    this.validator.validateUserId(user.id);

    return await this.dataSource.transaction(async (manager) => {
      // 1. Fetch medical record with relations
      const record = await this.fetchRecordWithRelations(manager, id);

      if (!record) {
        throw new NotFoundException(
          `Rekam medis dengan ID #${id} tidak ditemukan`,
        );
      }

      // 2. Check authorization
      this.authService.validateUpdatePermission(user, record);

      // 3. Validate appointment is still valid for updates
      this.domainService.validateAppointmentForUpdate(record.appointment);

      // 4. Map update DTO to entity
      const updateData = this.mapper.toUpdateEntity(dto);

      // 5. Validate update has changes
      this.domainService.validateUpdateHasChanges(updateData);

      // 6. Validate SOAP fields
      this.domainService.validateAllSOAPFields(updateData);

      // 7. Log update action
      this.logger.log(
        `User ${user.id} (${this.authService.getRoleSummary(user)}) ` +
          `updating medical record #${id} (created by user ${record.doctor_id})`,
      );

      // 8. Merge update data with existing record
      const updatedRecord = this.domainService.mergeUpdateData(
        record,
        updateData,
      );

      // 9. Save updated record
      const savedRecord = await manager.save(MedicalRecord, updatedRecord);

      // 10. Ensure appointment status is SELESAI
      await this.ensureAppointmentCompleted(manager, record.appointment);

      // 11. Reload with fresh relations
      const reloadedRecord = await this.fetchRecordWithRelations(
        manager,
        savedRecord.id,
      );

      if (!reloadedRecord) {
        throw new NotFoundException(
          `Rekam medis dengan ID #${savedRecord.id} tidak ditemukan setelah pembaruan`,
        );
      }

      return reloadedRecord;
    });
  }

  /**
   * Fetch medical record with all necessary relations
   */
  private async fetchRecordWithRelations(
    manager: EntityManager,
    id: string,
  ): Promise<MedicalRecord | null> {
    return await manager.findOne(MedicalRecord, {
      where: { id },
      relations: [
        'appointment',
        'appointment.patient',
        'appointment.doctor',
        'appointment.doctor.roles',
        'doctor',
        'patient',
      ],
    });
  }

  /**
   * Ensure appointment status is SELESAI after medical record is updated
   */
  private async ensureAppointmentCompleted(
    manager: EntityManager,
    appointment: Appointment,
  ): Promise<void> {
    if (this.domainService.shouldUpdateAppointmentStatus(appointment)) {
      appointment.status = AppointmentStatus.SELESAI;
      await manager.save(Appointment, appointment);

      this.logger.log(
        `Appointment #${appointment.id} status updated to SELESAI`,
      );
    }
  }
}
