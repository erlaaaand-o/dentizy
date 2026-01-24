// backend/src/treatment-categories/infrastructures/listeners/treatment-category-updated.listener.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TreatmentCategoryUpdatedEvent } from '../../infrastructures/events/treatment-category-updated.event';

@Injectable()
export class TreatmentCategoryUpdatedListener {
  private readonly logger = new Logger(TreatmentCategoryUpdatedListener.name);

  @OnEvent('treatment-category.updated')
  handleUpdatedEvent(event: TreatmentCategoryUpdatedEvent) {
    this.logger.log(
      `Treatment category updated: ID=${event.categoryId}, Name=${event.categoryName}`,
    );

    // Additional actions: invalidate cache, send notification, etc.
  }
}
