import { Appointment } from '../../domains/entities/appointment.entity';

/**
 * Event: Appointment Deleted
 * Triggered ketika appointment dihapus
 */
export class AppointmentDeletedEvent {
  constructor(
    public readonly appointmentId: Appointment,
    public readonly deletedBy: string,
  ) {}
}
