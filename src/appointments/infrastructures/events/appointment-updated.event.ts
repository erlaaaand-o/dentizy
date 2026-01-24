import { Appointment } from '../../domains/entities/appointment.entity';

/**
 * Event: Appointment Updated
 * Triggered ketika appointment diupdate
 */
export class AppointmentUpdatedEvent {
  constructor(
    public readonly appointment: Appointment,
    public readonly isTimeUpdated: boolean, // apakah waktu berubah (perlu reschedule)
    public readonly updatedBy?: string,
  ) {}
}
