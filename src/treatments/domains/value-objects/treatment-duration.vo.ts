// backend/src/treatments/domains/value-objects/treatment-duration.vo.ts
export class TreatmentDuration {
  private readonly minutes: number;

  constructor(minutes: number) {
    this.validate(minutes);
    this.minutes = minutes;
  }

  private validate(minutes: number): void {
    if (minutes < 0) {
      throw new Error('Duration cannot be negative');
    }
    if (minutes > 1440) {
      // 24 hours
      throw new Error('Duration cannot exceed 24 hours');
    }
  }

  getMinutes(): number {
    return this.minutes;
  }

  getHours(): number {
    return Math.floor(this.minutes / 60);
  }

  getFormattedDuration(): string {
    const hours = this.getHours();
    const mins = this.minutes % 60;
    if (hours === 0) return `${mins} menit`;
    if (mins === 0) return `${hours} jam`;
    return `${hours} jam ${mins} menit`;
  }
}
