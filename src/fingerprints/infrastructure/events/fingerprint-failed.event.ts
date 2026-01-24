export class FingerprintFailedEvent {
  constructor(
    public readonly templateData: string,
    public readonly reason: string,
    public readonly patientId?: number,
  ) {}

  get eventName(): string {
    return 'fingerprint.failed';
  }

  get payload() {
    return {
      patientId: this.patientId,
      reason: this.reason,
      attemptedAt: new Date(),
      templateLength: this.templateData?.length || 0,
    };
  }
}
