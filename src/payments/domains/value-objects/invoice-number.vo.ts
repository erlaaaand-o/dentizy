// backend/src/payments/domains/value-objects/invoice-number.vo.ts
export class InvoiceNumber {
  private readonly value: string;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid invoice number format');
    }
    this.value = value;
  }

  private isValid(value: string): boolean {
    const pattern = /^INV\/\d{8}\/\d{4}$/;
    return pattern.test(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: InvoiceNumber): boolean {
    return this.value === other.value;
  }
}
