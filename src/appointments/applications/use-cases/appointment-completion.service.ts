import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { User } from '../../../users/domains/entities/user.entity';
import { Appointment } from '../../domains/entities/appointment.entity';
import { AppointmentDomainService } from '../../domains/services/appointment-domain.service';
import { AppointmentValidator } from '../../domains/validators/appointment.validator';
import { AppointmentCompletedEvent } from '../../infrastructures/events/';
import { AppointmentsRepository } from '../../infrastructures/persistence/repositories/appointments.repository';

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
      const appointment = await this.repository.findById(id);

      this.validator.validateAppointmentExists(appointment, id);

      this.validator.validateViewAuthorization(appointment, user);
      this.validator.validateStatusForCompletion(appointment);
      this.validator.validateCompletionAuthorization(appointment, user);

      const updatedAppointment =
        this.domainService.completeAppointment(appointment);
      const savedAppointment = await this.repository.save(updatedAppointment);

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
