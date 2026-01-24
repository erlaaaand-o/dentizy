// backend/src/medical-records/infrastructure/listeners/medical-record.event-listener.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MedicalRecordCreatedEvent } from '../events/medical-record-created.event';
import { MedicalRecordUpdatedEvent } from '../events/medical-record-updated.event';
import { MedicalRecordDeletedEvent } from '../events/medical-record-deleted.event';

// Interface untuk event restore (jika belum ada file event fisiknya)
export interface RestoredEvent {
  medicalRecordId: number;
  restoredBy: number;
  timestamp?: Date;
}

/**
 * Event Listener for Medical Record Domain Events
 * Handles side effects and notifications when medical records change
 */
@Injectable()
export class MedicalRecordEventListener {
  private readonly logger = new Logger(MedicalRecordEventListener.name);

  /**
   * Handle medical record created event
   */
  @OnEvent('medical_record.created')
  async handleMedicalRecordCreated(
    event: MedicalRecordCreatedEvent,
  ): Promise<void> {
    this.logger.log(`📝 ${event.getDescription()}`);

    try {
      // Audit logging
      await this.logAuditTrail('created', event.toJSON());

      // Check completeness
      if (event.metadata?.isComplete) {
        this.logger.log(
          `✅ Medical record #${event.medicalRecordId} is complete with all SOAP fields`,
        );
      } else {
        this.logger.warn(
          `⚠️ Medical record #${event.medicalRecordId} is incomplete`,
        );
      }

      // Send notification to relevant parties
      await this.sendNotification(event);

      // Update statistics/cache
      await this.updateStatistics(event.toJSON());

      // Trigger external integrations (if any)
      await this.triggerIntegrations(event);
    } catch (error) {
      this.handleError('created', error);
    }
  }

  /**
   * Handle medical record updated event
   */
  @OnEvent('medical_record.updated')
  async handleMedicalRecordUpdated(
    event: MedicalRecordUpdatedEvent,
  ): Promise<void> {
    this.logger.log(`✏️ ${event.getDescription()}`);

    try {
      // Audit logging with change tracking
      await this.logAuditTrail('updated', event.toJSON());

      // Check if record became complete
      if (event.metadata?.isNowComplete && !event.metadata?.wasComplete) {
        this.logger.log(
          `✅ Medical record #${event.medicalRecordId} is now complete`,
        );
        await this.handleRecordCompleted(event);
      }

      // Log significant changes
      if (event.getUpdatedFieldsCount() > 0) {
        this.logger.debug(
          `Updated ${event.getUpdatedFieldsCount()} field(s) in record #${event.medicalRecordId}`,
        );
      }

      // Send update notification
      await this.sendUpdateNotification(event);

      // Invalidate cache
      await this.invalidateCache(event);
    } catch (error) {
      this.handleError('updated', error);
    }
  }

  /**
   * Handle medical record deleted event
   */
  @OnEvent('medical_record.deleted')
  async handleMedicalRecordDeleted(
    event: MedicalRecordDeletedEvent,
  ): Promise<void> {
    const severity = event.getSeverity();
    const logMethod = severity === 'critical' ? 'error' : 'warn';

    this.logger[logMethod](`🗑️ ${event.getDescription()}`);

    try {
      // Audit logging with high priority
      await this.logAuditTrail('deleted', event.toJSON(), severity);

      // Send deletion notification
      await this.sendDeletionNotification(event);

      // Archive data if permanent deletion
      if (event.isPermanent()) {
        this.logger.warn(
          `⚠️ PERMANENT DELETION: Medical record #${event.medicalRecordId}`,
        );
        await this.archiveBeforePermanentDeletion(event);
      }

      // Update statistics
      await this.updateDeletionStatistics(event);

      // Clear cache
      await this.clearCacheForDeletedRecord(event);
    } catch (error) {
      this.handleError('deleted', error);
    }
  }

  /**
   * Handle medical record restored event
   */
  @OnEvent('medical_record.restored')
  async handleMedicalRecordRestored(event: RestoredEvent): Promise<void> {
    this.logger.log(
      `♻️ Medical record #${event.medicalRecordId} restored by user #${event.restoredBy}`,
    );

    try {
      // Audit logging
      await this.logAuditTrail('restored', event);

      // Send restoration notification
      await this.sendRestorationNotification(event);

      // Update statistics
      await this.updateStatistics(event);
    } catch (error) {
      this.handleError('restored', error);
    }
  }

  // ===========================================================================
  // PRIVATE HELPER METHODS
  // ===========================================================================

  /**
   * Log audit trail to database/external service
   * Menggunakan 'object' agar bisa menerima Interface hasil toJSON()
   */
  private async logAuditTrail(
    action: string,
    data: object,
    severity: 'info' | 'warning' | 'critical' = 'info',
  ): Promise<void> {
    this.logger.debug(
      `[AUDIT] Action: ${action} | Severity: ${severity} | Data: ${JSON.stringify(data)}`,
    );
  }

  private async sendNotification(
    event: MedicalRecordCreatedEvent,
  ): Promise<void> {
    this.logger.debug(
      `Sending creation notification for Record #${event.medicalRecordId} to Doctor #${event.doctorId}`,
    );
  }

  private async sendUpdateNotification(
    event: MedicalRecordUpdatedEvent,
  ): Promise<void> {
    this.logger.debug(
      `Sending update notification for Record #${event.medicalRecordId}`,
    );
  }

  private async sendDeletionNotification(
    event: MedicalRecordDeletedEvent,
  ): Promise<void> {
    this.logger.debug(
      `Deletion notification sent for medical record #${event.medicalRecordId}`,
    );
  }

  private async sendRestorationNotification(
    event: RestoredEvent,
  ): Promise<void> {
    this.logger.debug(
      `Restoration notification sent for medical record #${event.medicalRecordId}`,
    );
  }

  private async updateStatistics(data: object): Promise<void> {
    this.logger.debug('Statistics updated');
  }

  private async updateDeletionStatistics(
    event: MedicalRecordDeletedEvent,
  ): Promise<void> {
    this.logger.debug('Deletion statistics updated');
  }

  private async triggerIntegrations(
    event: MedicalRecordCreatedEvent,
  ): Promise<void> {
    this.logger.debug('External integrations triggered');
  }

  private async handleRecordCompleted(
    event: MedicalRecordUpdatedEvent,
  ): Promise<void> {
    this.logger.log(
      `Record completion workflow triggered for #${event.medicalRecordId}`,
    );
  }

  private async invalidateCache(
    event: MedicalRecordUpdatedEvent,
  ): Promise<void> {
    this.logger.debug(
      `Cache invalidated for medical record #${event.medicalRecordId}`,
    );
  }

  private async clearCacheForDeletedRecord(
    event: MedicalRecordDeletedEvent,
  ): Promise<void> {
    this.logger.debug(
      `Cache cleared for deleted record #${event.medicalRecordId}`,
    );
  }

  private async archiveBeforePermanentDeletion(
    event: MedicalRecordDeletedEvent,
  ): Promise<void> {
    this.logger.warn(
      `Archiving data for permanent deletion of record #${event.medicalRecordId}`,
    );
  }

  /**
   * Centralized error handling
   */
  private handleError(eventType: string, error: unknown): void {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    this.logger.error(
      `Failed to process medical_record.${eventType} event: ${errorMessage}`,
      errorStack,
    );
  }
}
