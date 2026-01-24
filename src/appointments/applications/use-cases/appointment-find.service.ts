import { Injectable, Logger } from '@nestjs/common';
import { Appointment } from '../../domains/entities/appointment.entity';
import { User } from '../../../users/domains/entities/user.entity';
import { AppointmentsRepository } from '../../infrastructures/persistence/repositories/appointments.repository';
import { AppointmentValidator } from '../../domains/validators/appointment.validator';

/**
 * Use Case: Find Appointment by ID
 * Mencari appointment berdasarkan ID dengan authorization
 */
@Injectable()
export class AppointmentFindService {
  private readonly logger = new Logger(AppointmentFindService.name);

  constructor(
    private readonly repository: AppointmentsRepository,
    private readonly validator: AppointmentValidator,
  ) {}

  /**
   * Execute: Find appointment by ID
   */
  async execute(id: string, user: User): Promise<Appointment> {
    try {
      // 1. FIND APPOINTMENT
      const appointment = await this.repository.findById(id);

      // 2. VALIDASI: Appointment exists
      this.validator.validateAppointmentExists(appointment, id);

      // TypeScript now knows appointment is not null
      const validAppointment = appointment!;

      // 3. VALIDASI: Authorization (dokter hanya bisa lihat milik sendiri)
      this.validator.validateViewAuthorization(validAppointment, user);

      this.logger.debug(`📋 Found appointment #${id}`);

      return validAppointment;
    } catch (error) {
      this.logger.error(
        `❌ Error finding appointment ID ${id}:`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
