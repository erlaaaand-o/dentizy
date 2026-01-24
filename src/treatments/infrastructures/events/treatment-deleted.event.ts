// backend/src/treatments/domains/events/treatment-deleted.event.ts
export class TreatmentDeletedEvent {
  constructor(
    public readonly treatmentId: string,
    public readonly kodePerawatan: string,
    public readonly deletedAt: Date,
  ) {}
}
