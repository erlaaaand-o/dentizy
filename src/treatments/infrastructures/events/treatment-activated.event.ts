// backend/src/treatments/domains/events/treatment-activated.event.ts
export class TreatmentActivatedEvent {
  constructor(
    public readonly treatmentId: string,
    public readonly kodePerawatan: string,
    public readonly activatedAt: Date,
  ) {}
}
