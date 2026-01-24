// backend/src/treatments/domains/value-objects/treatment-code.vo.ts
export class TreatmentCode {
  private readonly value: string;

  constructor(code: string) {
    this.validate(code);
    this.value = code.toUpperCase().trim();
  }

  private validate(code: string): void {
    if (!code || code.trim().length === 0) {
      throw new Error('Treatment code cannot be empty');
    }
    if (code.length > 50) {
      throw new Error('Treatment code cannot exceed 50 characters');
    }
    if (!/^[A-Z0-9-_]+$/i.test(code)) {
      throw new Error(
        'Treatment code can only contain alphanumeric characters, hyphens, and underscores',
      );
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: TreatmentCode): boolean {
    return this.value === other.value;
  }
}
