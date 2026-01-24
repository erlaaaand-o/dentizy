// backend/src/treatment-categories/domains/events/treatment-category-created.event.ts
export class TreatmentCategoryCreatedEvent {
  constructor(
    public readonly categoryId: string,
    public readonly categoryName: string,
    public readonly createdAt: Date,
  ) {}
}
