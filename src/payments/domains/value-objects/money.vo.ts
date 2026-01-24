// backend/src/payments/domains/value-objects/money.vo.ts
export class Money {
  private readonly amount: number;

  constructor(amount: number) {
    if (amount < 0) {
      throw new Error('Money amount cannot be negative');
    }
    this.amount = Math.round(amount * 100) / 100; // Round to 2 decimals
  }

  getAmount(): number {
    return this.amount;
  }

  add(other: Money): Money {
    return new Money(this.amount + other.getAmount());
  }

  subtract(other: Money): Money {
    const result = this.amount - other.getAmount();
    return new Money(Math.max(0, result));
  }

  isGreaterThan(other: Money): boolean {
    return this.amount > other.getAmount();
  }

  isGreaterThanOrEqual(other: Money): boolean {
    return this.amount >= other.getAmount();
  }

  equals(other: Money): boolean {
    return this.amount === other.getAmount();
  }
}
