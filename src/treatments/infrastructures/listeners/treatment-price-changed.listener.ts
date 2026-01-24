// backend/src/treatments/applications/listeners/treatment-price-changed.listener.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TreatmentPriceChangedEvent } from '../../infrastructures/events/treatment-price-changed.event';

@Injectable()
export class TreatmentPriceChangedListener {
  private readonly logger = new Logger(TreatmentPriceChangedListener.name);

  @OnEvent('treatment.price.changed')
  async handlePriceChanged(event: TreatmentPriceChangedEvent): Promise<void> {
    this.logger.log(
      `Treatment price changed: ID ${event.treatmentId}, Old: ${event.oldPrice}, New: ${event.newPrice}`,
    );

    // Additional actions:
    // - Notify finance department
    // - Update pricing reports
    // - Recalculate package prices
    // - Send notification to admins
  }
}
