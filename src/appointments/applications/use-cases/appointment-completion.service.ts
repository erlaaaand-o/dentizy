import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Appointment } from '../../domains/entities/appointment.entity';
import { User } from '../../../users/domains/entities/user.entity';
import { AppointmentsRepository } from '../../infrastructures/persistence/repositories/appointments.repository';
import { AppointmentValidator } from '../../domains/validators/appointment.validator';
import { AppointmentDomainService } from '../../domains/services/appointment-domain.service';
import { AppointmentCompletedEvent } from '../../infrastructures/events/';

/**
 * Use Case: Complete Appointment
 * Menyelesaikan appointment (status DIJADWALKAN → SELESAI)
 */
@Injectable()
export class AppointmentCompletionService {
  private readonly logger = new Logger(AppointmentCompletionService.name);

  constructor(
    private readonly repository: AppointmentsRepository,
    private readonly validator: AppointmentValidator,
    private readonly domainService: AppointmentDomainService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Execute: Complete appointment
   */
  async execute(id: string, user: User): Promise<Appointment> {
    try {
      // 1. FIND APPOINTMENT
      const appointment = await this.repository.findById(id);
      this.validator.validateAppointmentExists(appointment, id);

      // TypeScript now knows appointment is not null
      const validAppointment = appointment!;

      // 2. VALIDASI: Authorization
      this.validator.validateViewAuthorization(validAppointment, user);

      // 3. VALIDASI: Status harus DIJADWALKAN
      this.validator.validateStatusForCompletion(validAppointment);

      // 4. VALIDASI: Authorization untuk completion
      this.validator.validateCompletionAuthorization(validAppointment, user);

      // 5. UPDATE STATUS
      const updatedAppointment =
        this.domainService.completeAppointment(validAppointment);
      const savedAppointment = await this.repository.save(updatedAppointment);

      // 6. EMIT EVENT
      this.eventEmitter.emit(
        'appointment.completed',
        new AppointmentCompletedEvent(savedAppointment, user.id),
      );

      this.logger.log(`✅ Appointment #${id} completed by user #${user.id}`);

      return savedAppointment;
    } catch (error) {
      this.logger.error(
        `❌ Error completing appointment ID ${id}:`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
