// backend/src/treatment-categories/domains/events/treatment-category-updated.event.ts
export class TreatmentCategoryUpdatedEvent {
  constructor(
    public readonly categoryId: string,
    public readonly categoryName: string,
    public readonly updatedAt: Date,
  ) {}
}
