// backend/src/treatment-categories/domains/events/treatment-category-restored.event.ts
export class TreatmentCategoryRestoredEvent {
  constructor(
    public readonly categoryId: string,
    public readonly categoryName: string,
    public readonly restoredAt: Date,
  ) {}
}
