import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Appointment } from '../../domains/entities/appointment.entity';
import { User } from '../../../users/domains/entities/user.entity';
import { AppointmentsRepository } from '../../infrastructures/persistence/repositories/appointments.repository';
import { AppointmentCancellationValidator } from '../../domains/validators/appointment-cancellation.validator';
import { AppointmentDomainService } from '../../domains/services/appointment-domain.service';
import { TransactionManager } from '../../infrastructures/transactions/transaction.manager';
import { AppointmentCancelledEvent } from '../../infrastructures/events/';

/**
 * Use Case: Cancel Appointment
 * Membatalkan appointment dengan validasi business rules
 */
@Injectable()
export class AppointmentCancellationService {
  private readonly logger = new Logger(AppointmentCancellationService.name);

  constructor(
    private readonly repository: AppointmentsRepository,
    private readonly cancellationValidator: AppointmentCancellationValidator,
    private readonly domainService: AppointmentDomainService,
    private readonly transactionManager: TransactionManager,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Execute: Cancel appointment
   */
  async execute(id: string, user: User, reason?: string): Promise<Appointment> {
    const queryRunner = this.repository.createQueryRunner();

    try {
      const appointment = await this.transactionManager.executeInTransaction(
        queryRunner,
        async (qr) => {
          // 1. FIND APPOINTMENT
          const appointment = await this.repository.findByIdInTransaction(
            qr,
            id,
          );

          if (!appointment) {
            throw new NotFoundException(
              `Janji temu dengan ID #${id} tidak ditemukan`,
            );
          }

          // 2. VALIDASI: Comprehensive cancellation validation
          this.cancellationValidator.validateCancellation(appointment, user);

          // 3. CANCEL APPOINTMENT
          const cancelledAppointment =
            this.domainService.cancelAppointment(appointment);

          return await this.repository.updateInTransaction(
            qr,
            cancelledAppointment,
          );
        },
        'cancel-appointment',
      );

      // 4. EMIT EVENT (di luar transaction)
      this.eventEmitter.emit(
        'appointment.cancelled',
        new AppointmentCancelledEvent(appointment, user.id, reason),
      );

      this.logger.log(`❌ Appointment #${id} cancelled by user #${user.id}`);

      return appointment;
    } catch (error) {
      this.logger.error(
        `❌ Error cancelling appointment ID ${id}:`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
