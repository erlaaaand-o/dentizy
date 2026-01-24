// backend/src/treatments/domains/events/treatment-updated.event.ts
export class TreatmentUpdatedEvent {
  constructor(
    public readonly treatmentId: string,
    public readonly changes: Partial<{
      kodePerawatan: string;
      namaPerawatan: string;
      categoryId: string;
      harga: number;
      durasiEstimasi: number;
      isActive: boolean;
    }>,
    public readonly updatedAt: Date,
  ) {}
}
