// backend/src/treatments/domains/events/treatment-deactivated.event.ts
export class TreatmentDeactivatedEvent {
  constructor(
    public readonly treatmentId: string,
    public readonly kodePerawatan: string,
    public readonly deactivatedAt: Date,
  ) {}
}
