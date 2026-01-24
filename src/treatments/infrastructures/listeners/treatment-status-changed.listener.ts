// backend/src/treatments/applications/listeners/treatment-status-changed.listener.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TreatmentActivatedEvent } from '../../infrastructures/events/treatment-activated.event';
import { TreatmentDeactivatedEvent } from '../../infrastructures/events/treatment-deactivated.event';

@Injectable()
export class TreatmentStatusChangedListener {
  private readonly logger = new Logger(TreatmentStatusChangedListener.name);

  @OnEvent('treatment.activated')
  async handleTreatmentActivated(
    event: TreatmentActivatedEvent,
  ): Promise<void> {
    this.logger.log(
      `Treatment activated: ${event.kodePerawatan} (ID: ${event.treatmentId})`,
    );
  }

  @OnEvent('treatment.deactivated')
  async handleTreatmentDeactivated(
    event: TreatmentDeactivatedEvent,
  ): Promise<void> {
    this.logger.warn(
      `Treatment deactivated: ${event.kodePerawatan} (ID: ${event.treatmentId})`,
    );
  }
}
