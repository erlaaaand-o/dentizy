import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { EmailService } from '../../../notifications/services/email.service';
import {
  AppointmentCreatedEvent,
  AppointmentCancelledEvent,
  AppointmentCompletedEvent,
  AppointmentUpdatedEvent,
  AppointmentDeletedEvent,
} from '../events';

/**
 * Event listener untuk appointment events
 * Handle side effects seperti notifications, logging, analytics
 */
@Injectable()
export class AppointmentEventListener {
  private readonly logger = new Logger(AppointmentEventListener.name);

  constructor(private readonly emailService: EmailService) {}

  /**
   * Handle appointment created event
   * Schedule reminder notification
   */
  @OnEvent('appointment.created')
  async handleAppointmentCreated(
    event: AppointmentCreatedEvent,
  ): Promise<void> {
    this.logger.log(`📅 Appointment created: #${event.appointment.id}`);

    if (event.shouldScheduleReminder) {
      try {
        await this.emailService.sendEmail({
          to: event.appointment.patient.email || null || '',
          subject: 'Appointment Reminder Scheduled',
          html: `<p>Your appointment scheduled on ${event.appointment.tanggal_janji} has been created successfully. We will send you a reminder prior to the appointment.</p>`,
        });
        this.logger.log(
          `📧 Reminder scheduled for appointment #${event.appointment.id}`,
        );
      } catch (error) {
        this.logger.error(
          `❌ Failed to schedule reminder for appointment #${event.appointment.id}:`,
          error instanceof Error ? error.message : String(error),
          error instanceof Error ? error.stack : undefined,
        );
      }
    }
  }

  /**
   * Handle appointment cancelled event
   * Cancel reminder notifications
   */
  @OnEvent('appointment.cancelled')
  async handleAppointmentCancelled(
    event: AppointmentCancelledEvent,
  ): Promise<void> {
    this.logger.log(
      `❌ Appointment cancelled: #${event.appointment.id} by user #${event.cancelledBy}${
        event.reason ? ` (reason: ${event.reason})` : ''
      }`,
    );

    try {
      await this.emailService.sendEmail({
        to: event.appointment.patient.email || null || '',
        subject: 'Appointment Cancelled',
        html: `<p>Your appointment scheduled on ${event.appointment.tanggal_janji} has been cancelled.</p>`,
      });
      this.logger.log(
        `📧 Reminders cancelled for appointment #${event.appointment.id}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to cancel reminders for appointment #${event.appointment.id}:`,
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Handle appointment completed event
   * Log completion, dapat diperluas untuk analytics
   */
  @OnEvent('appointment.completed')
  async handleAppointmentCompleted(
    event: AppointmentCompletedEvent,
  ): Promise<void> {
    this.logger.log(
      `✅ Appointment completed: #${event.appointment.id} by user #${event.completedBy}`,
    );

    try {
      await this.emailService.sendEmail({
        to: event.appointment.patient.email || null || '',
        subject: 'Appointment Completed',
        html: `<p>Thank you for attending your appointment on ${event.appointment.tanggal_janji}. We hope to see you again!</p>`,
      });
    } catch (error) {
      this.logger.error(
        `❌ Error handling completion for appointment #${event.appointment.id}:`,
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Handle appointment updated event
   * Reschedule reminder jika waktu berubah
   */
  @OnEvent('appointment.updated')
  async handleAppointmentUpdated(
    event: AppointmentUpdatedEvent,
  ): Promise<void> {
    this.logger.log(
      `🔄 Appointment updated: #${event.appointment.id}${
        event.updatedBy ? ` by user #${event.updatedBy}` : ''
      }`,
    );

    if (event.isTimeUpdated) {
      try {
        // Cancel old reminder
        await this.emailService.sendEmail({
          to: event.appointment.patient.email || null || '',
          subject: 'Appointment Reminder Cancelled',
          html: `<p>Your appointment reminder for ${event.appointment.tanggal_janji} has been cancelled.</p>`,
        });

        // Schedule new reminder if applicable
        if (
          event.appointment.patient?.email &&
          event.appointment.patient?.is_registered_online
        ) {
          await this.emailService.sendEmail({
            to: event.appointment.patient.email || null || '',
            subject: 'Appointment Reminder Scheduled',
            html: `<p>Your appointment is scheduled for ${event.appointment.tanggal_janji}. Please be on time!</p>`,
          });
          this.logger.log(
            `📧 Reminder rescheduled for appointment #${event.appointment.id}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `❌ Failed to reschedule reminder for appointment #${event.appointment.id}:`,
          error instanceof Error ? error.message : String(error),
          error instanceof Error ? error.stack : undefined,
        );
      }
    }
  }

  /**
   * Handle appointment deleted event
   * Cancel reminders and cleanup
   */
  @OnEvent('appointment.deleted')
  async handleAppointmentDeleted(
    event: AppointmentDeletedEvent,
  ): Promise<void> {
    this.logger.log(
      `🗑️ Appointment deleted: #${event.appointmentId} by user #${event.deletedBy}`,
    );

    try {
      await this.emailService.sendEmail({
        to: event.appointmentId.patient.email || null || '',
        subject: 'Appointment Reminder Cancelled',
        html: `<p>Your appointment reminder for ${event.appointmentId.patient.email} has been cancelled.</p>`,
      });
      this.logger.log(
        `📧 Reminders cancelled for deleted appointment #${event.appointmentId}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to cancel reminders for deleted appointment #${event.appointmentId}:`,
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
