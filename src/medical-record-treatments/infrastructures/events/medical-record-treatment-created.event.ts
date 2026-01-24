// backend/src/medical-record-treatments/infrastructures/events/medical-record-treatment-created.event.ts
export class MedicalRecordTreatmentCreatedEvent {
  constructor(
    public readonly medicalRecordTreatmentId: string,
    public readonly medicalRecordId: string,
    public readonly treatmentId: string,
    public readonly total: number,
    public readonly createdAt: Date,
  ) {}
}
