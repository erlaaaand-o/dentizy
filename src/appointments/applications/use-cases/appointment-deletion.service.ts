import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { User } from '../../../users/domains/entities/user.entity';
import { AppointmentsRepository } from '../../infrastructures/persistence/repositories/appointments.repository';
import { AppointmentValidator } from '../../domains/validators/appointment.validator';
import { AppointmentDeletedEvent } from '../../infrastructures/events';

/**
 * Use Case: Delete Appointment
 * Menghapus appointment (hard delete)
 */
@Injectable()
export class AppointmentDeletionService {
  private readonly logger = new Logger(AppointmentDeletionService.name);

  constructor(
    private readonly repository: AppointmentsRepository,
    private readonly validator: AppointmentValidator,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Execute: Delete appointment
   * Note: Hanya bisa delete jika belum ada medical record
   */
  async execute(id: string, user: User): Promise<void> {
    try {
      // 1. FIND APPOINTMENT
      const appointment = await this.repository.findById(id);
      this.validator.validateAppointmentExists(appointment, id);

      // TypeScript now knows appointment is not null
      const validAppointment = appointment!;

      // 2. VALIDASI: Tidak boleh delete jika sudah ada medical record
      this.validator.validateForDeletion(validAppointment);

      // 3. DELETE APPOINTMENT
      await this.repository.remove(validAppointment);

      // 4. EMIT EVENT
      this.eventEmitter.emit(
        'appointment.deleted',
        new AppointmentDeletedEvent(validAppointment, user.id),
      );

      this.logger.log(`🗑️ Appointment #${id} deleted by user #${user.id}`);
    } catch (error) {
      this.logger.error(
        `❌ Error deleting appointment ID ${id}:`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
