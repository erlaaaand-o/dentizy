// backend/src/treatment-categories/domains/events/treatment-category-deleted.event.ts
export class TreatmentCategoryDeletedEvent {
  constructor(
    public readonly categoryId: string,
    public readonly categoryName: string,
    public readonly deletedAt: Date,
  ) {}
}
