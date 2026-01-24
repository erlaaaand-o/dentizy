// backend/src/treatment-categories/infrastructures/listeners/treatment-category-created.listener.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TreatmentCategoryCreatedEvent } from '../../infrastructures/events/treatment-category-created.event';

@Injectable()
export class TreatmentCategoryCreatedListener {
  private readonly logger = new Logger(TreatmentCategoryCreatedListener.name);

  @OnEvent('treatment-category.created')
  handleCreatedEvent(event: TreatmentCategoryCreatedEvent) {
    this.logger.log(
      `Treatment category created: ID=${event.categoryId}, Name=${event.categoryName}`,
    );

    // Additional actions: send notification, update cache, etc.
  }
}
