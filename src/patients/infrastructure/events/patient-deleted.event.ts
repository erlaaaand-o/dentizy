export class PatientDeletedEvent {
  constructor(
    public readonly patientId: string,
    public readonly patientName: string,
  ) {}
}
