// backend/src/treatments/infrastructures/persistence/queries/get-active-treatments.query.ts
export class GetActiveTreatmentsQuery {
  constructor(
    public readonly categoryId?: string,
    public readonly limit?: number,
  ) {}
}
