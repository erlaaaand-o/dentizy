// backend/src/treatments/domains/events/treatment-price-changed.event.ts
export class TreatmentPriceChangedEvent {
  constructor(
    public readonly treatmentId: string,
    public readonly oldPrice: number,
    public readonly newPrice: number,
    public readonly changedAt: Date,
  ) {}
}
