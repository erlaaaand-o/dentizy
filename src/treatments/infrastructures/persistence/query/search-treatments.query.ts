// backend/src/treatments/infrastructures/persistence/queries/search-treatments.query.ts
export class SearchTreatmentsQuery {
  constructor(
    public readonly keyword: string,
    public readonly categoryId?: string,
  ) {}
}
