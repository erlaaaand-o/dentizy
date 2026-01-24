// backend/src/treatments/applications/listeners/treatment-created.listener.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TreatmentCreatedEvent } from '../../infrastructures/events/treatment-created.event';

@Injectable()
export class TreatmentCreatedListener {
  private readonly logger = new Logger(TreatmentCreatedListener.name);

  @OnEvent('treatment.created')
  async handleTreatmentCreated(event: TreatmentCreatedEvent): Promise<void> {
    this.logger.log(
      `Treatment created: ${event.kodePerawatan} - ${event.namaPerawatan} (ID: ${event.treatmentId})`,
    );

    // Additional actions:
    // - Send notification
    // - Update cache
    // - Log to audit system
    // - Trigger analytics
  }
}
