import { Appointment } from '../../domains/entities/appointment.entity';

/**
 * Event: Appointment Completed
 * Triggered ketika appointment diselesaikan
 */
export class AppointmentCompletedEvent {
  constructor(
    public readonly appointment: Appointment,
    public readonly completedBy: string, // user ID
  ) {}
}
