// backend/src/treatment-categories/infrastructures/listeners/treatment-category-deleted.listener.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TreatmentCategoryDeletedEvent } from '../../infrastructures/events/treatment-category-deleted.event';

@Injectable()
export class TreatmentCategoryDeletedListener {
  private readonly logger = new Logger(TreatmentCategoryDeletedListener.name);

  @OnEvent('treatment-category.deleted')
  handleDeletedEvent(event: TreatmentCategoryDeletedEvent) {
    this.logger.log(
      `Treatment category deleted: ID=${event.categoryId}, Name=${event.categoryName}`,
    );

    // Additional actions: cleanup, audit log, etc.
  }
}
