// backend/src/treatment-categories/infrastructures/listeners/treatment-category-restored.listener.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TreatmentCategoryRestoredEvent } from '../../infrastructures/events/treatment-category-restored.event';

@Injectable()
export class TreatmentCategoryRestoredListener {
  private readonly logger = new Logger(TreatmentCategoryRestoredListener.name);

  @OnEvent('treatment-category.restored')
  handleRestoredEvent(event: TreatmentCategoryRestoredEvent) {
    this.logger.log(
      `Treatment category restored: ID=${event.categoryId}, Name=${event.categoryName}`,
    );

    // Additional actions: restore related data, notification, etc.
  }
}
