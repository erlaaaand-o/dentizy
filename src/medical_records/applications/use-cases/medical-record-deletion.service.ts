import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalRecord } from '../../domains/entities/medical-record.entity';
import { User } from '../../../users/domains/entities/user.entity';
import { MedicalRecordAuthorizationService } from '../../domains/services/medical-record-authorization.service';
import { MedicalRecordValidator } from '../../domains/validators/medical-record.validator';

@Injectable()
export class MedicalRecordDeletionService {
  private readonly logger = new Logger(MedicalRecordDeletionService.name);

  constructor(
    @InjectRepository(MedicalRecord)
    private readonly repository: Repository<MedicalRecord>,
    private readonly authService: MedicalRecordAuthorizationService,
    private readonly validator: MedicalRecordValidator,
  ) {}

  /**
   * Delete (soft delete) medical record
   * Only Kepala Klinik can delete
   */
  async execute(id: string, user: User): Promise<void> {
    // Validate input
    this.validator.validateId(id);
    this.validator.validateUserId(user.id);

    // Check authorization first (only Kepala Klinik)
    this.authService.validateDeletePermission(user);

    // Find medical record
    const record = await this.repository.findOne({
      where: { id },
      relations: ['appointment', 'patient', 'doctor'],
    });

    if (!record) {
      throw new NotFoundException(
        `Rekam medis dengan ID #${id} tidak ditemukan`,
      );
    }

    // Log deletion action
    this.logger.warn(
      `User ${user.id} (${this.authService.getRoleSummary(user)}) ` +
        `deleting medical record #${id} for patient #${record.patient_id}`,
    );

    // Perform soft delete
    await this.repository.softRemove(record);

    this.logger.log(`Medical record #${id} successfully deleted (soft delete)`);
  }

  /**
   * Hard delete medical record (permanent removal)
   * Use with extreme caution
   */
  async hardDelete(id: string, user: User): Promise<void> {
    // Validate input
    this.validator.validateId(id);
    this.validator.validateUserId(user.id);

    // Check authorization
    this.authService.validateDeletePermission(user);

    // Find medical record
    const record = await this.repository.findOne({
      where: { id },
      withDeleted: true, // Include soft-deleted records
    });

    if (!record) {
      throw new NotFoundException(
        `Rekam medis dengan ID #${id} tidak ditemukan`,
      );
    }

    // Log hard deletion
    this.logger.warn(
      `HARD DELETE: User ${user.id} permanently removing medical record #${id}`,
    );

    // Permanent deletion
    await this.repository.remove(record);

    this.logger.warn(`Medical record #${id} PERMANENTLY DELETED`);
  }

  /**
   * Restore soft-deleted medical record
   */
  async restore(id: string, user: User): Promise<MedicalRecord> {
    // Validate input
    this.validator.validateId(id);
    this.validator.validateUserId(user.id);

    // Check authorization
    this.authService.validateDeletePermission(user);

    // Find soft-deleted record
    const record = await this.repository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!record) {
      throw new NotFoundException(
        `Rekam medis dengan ID #${id} tidak ditemukan`,
      );
    }

    if (!record.deleted_at) {
      throw new NotFoundException(
        `Rekam medis #${id} tidak dalam status dihapus`,
      );
    }

    // Restore record
    await this.repository.recover(record);

    this.logger.log(`User ${user.id} restored medical record #${id}`);

    return record;
  }
}
