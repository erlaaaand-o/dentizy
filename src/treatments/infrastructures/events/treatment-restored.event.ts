// backend/src/treatments/domains/events/treatment-restored.event.ts
export class TreatmentRestoredEvent {
  constructor(
    public readonly treatmentId: string,
    public readonly kodePerawatan: string,
    public readonly restoredAt: Date,
  ) {}
}
