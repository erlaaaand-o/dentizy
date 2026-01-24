// backend/src/treatments/domains/events/treatment-created.event.ts
export class TreatmentCreatedEvent {
  constructor(
    public readonly treatmentId: string,
    public readonly kodePerawatan: string,
    public readonly namaPerawatan: string,
    public readonly categoryId: string,
    public readonly harga: number,
    public readonly createdAt: Date,
  ) {}
}
