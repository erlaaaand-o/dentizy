// backend/src/treatments/applications/listeners/treatment-deleted.listener.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TreatmentDeletedEvent } from '../../infrastructures/events/treatment-deleted.event';

@Injectable()
export class TreatmentDeletedListener {
  private readonly logger = new Logger(TreatmentDeletedListener.name);

  @OnEvent('treatment.deleted')
  async handleTreatmentDeleted(event: TreatmentDeletedEvent): Promise<void> {
    this.logger.warn(
      `Treatment soft deleted: ${event.kodePerawatan} (ID: ${event.treatmentId})`,
    );

    // Additional actions:
    // - Archive data
    // - Update related records
    // - Clear cache
  }
}
