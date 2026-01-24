// backend/src/medical-record-treatments/infrastructures/events/medical-record-treatment-updated.event.ts
export class MedicalRecordTreatmentUpdatedEvent {
  constructor(
    public readonly medicalRecordTreatmentId: string,
    public readonly medicalRecordId: string,
    public readonly treatmentId: string,
    public readonly total: number,
    public readonly updatedAt: Date,
  ) {}
}
