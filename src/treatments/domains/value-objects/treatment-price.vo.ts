// backend/src/treatments/domains/value-objects/treatment-price.vo.ts
export class TreatmentPrice {
  private readonly value: number;

  constructor(price: number) {
    this.validate(price);
    this.value = price;
  }

  private validate(price: number): void {
    if (price < 0) {
      throw new Error('Treatment price cannot be negative');
    }
    if (price > 999999999999.99) {
      throw new Error('Treatment price exceeds maximum allowed value');
    }
  }

  getValue(): number {
    return this.value;
  }

  add(amount: number): TreatmentPrice {
    return new TreatmentPrice(this.value + amount);
  }

  subtract(amount: number): TreatmentPrice {
    return new TreatmentPrice(this.value - amount);
  }

  applyDiscount(percentage: number): TreatmentPrice {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Discount percentage must be between 0 and 100');
    }
    return new TreatmentPrice(this.value * (1 - percentage / 100));
  }

  isGreaterThan(other: TreatmentPrice): boolean {
    return this.value > other.value;
  }
}
