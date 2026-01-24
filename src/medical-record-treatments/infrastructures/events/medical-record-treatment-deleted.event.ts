// backend/src/medical-record-treatments/infrastructures/events/medical-record-treatment-deleted.event.ts
export class MedicalRecordTreatmentDeletedEvent {
  constructor(
    public readonly medicalRecordTreatmentId: string,
    public readonly medicalRecordId: string,
    public readonly deletedAt: Date,
  ) {}
}
