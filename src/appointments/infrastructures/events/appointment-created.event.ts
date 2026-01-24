import { Appointment } from '../../domains/entities/appointment.entity';

/**
 * Event: Appointment Created
 * Triggered ketika appointment baru dibuat
 */
export class AppointmentCreatedEvent {
  constructor(
    public readonly appointment: Appointment,
    public readonly shouldScheduleReminder: boolean,
  ) {}
}
