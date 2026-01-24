// backend/src/treatments/applications/listeners/treatment-restored.listener.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TreatmentRestoredEvent } from '../../infrastructures/events/treatment-restored.event';

@Injectable()
export class TreatmentRestoredListener {
  private readonly logger = new Logger(TreatmentRestoredListener.name);

  @OnEvent('treatment.restored')
  async handleTreatmentRestored(event: TreatmentRestoredEvent): Promise<void> {
    this.logger.log(
      `Treatment restored: ${event.kodePerawatan} (ID: ${event.treatmentId})`,
    );

    // Additional actions:
    // - Restore cache
    // - Notify users
    // - Update indexes
  }
}
