// backend/src/medical-record-treatments/applications/listeners/medical-record-treatment.listener.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MedicalRecordTreatmentCreatedEvent } from '../events/medical-record-treatment-created.event';
import { MedicalRecordTreatmentUpdatedEvent } from '../events/medical-record-treatment-updated.event';
import { MedicalRecordTreatmentDeletedEvent } from '../events/medical-record-treatment-deleted.event';

@Injectable()
export class MedicalRecordTreatmentListener {
  private readonly logger = new Logger(MedicalRecordTreatmentListener.name);

  @OnEvent('medical-record-treatment.created')
  handleTreatmentCreated(event: MedicalRecordTreatmentCreatedEvent) {
    this.logger.log(
      `Treatment created: ID ${event.medicalRecordTreatmentId} for Medical Record ${event.medicalRecordId} with total ${event.total}`,
    );
    // Tambahkan logika bisnis tambahan di sini, seperti:
    // - Update total biaya di medical record
    // - Kirim notifikasi
    // - Logging ke audit trail
  }

  @OnEvent('medical-record-treatment.updated')
  handleTreatmentUpdated(event: MedicalRecordTreatmentUpdatedEvent) {
    this.logger.log(
      `Treatment updated: ID ${event.medicalRecordTreatmentId} for Medical Record ${event.medicalRecordId}`,
    );
    // Tambahkan logika bisnis tambahan di sini
  }

  @OnEvent('medical-record-treatment.deleted')
  handleTreatmentDeleted(event: MedicalRecordTreatmentDeletedEvent) {
    this.logger.log(
      `Treatment deleted: ID ${event.medicalRecordTreatmentId} from Medical Record ${event.medicalRecordId}`,
    );
    // Tambahkan logika bisnis tambahan di sini
  }
}
