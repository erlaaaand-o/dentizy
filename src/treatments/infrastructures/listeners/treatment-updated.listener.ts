// backend/src/treatments/applications/listeners/treatment-updated.listener.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TreatmentUpdatedEvent } from '../../infrastructures/events/treatment-updated.event';

@Injectable()
export class TreatmentUpdatedListener {
  private readonly logger = new Logger(TreatmentUpdatedListener.name);

  @OnEvent('treatment.updated')
  async handleTreatmentUpdated(event: TreatmentUpdatedEvent): Promise<void> {
    this.logger.log(
      `Treatment updated: ID ${event.treatmentId}, Changes: ${JSON.stringify(event.changes)}`,
    );

    // Additional actions:
    // - Invalidate cache
    // - Notify related systems
    // - Update search index
  }
}
