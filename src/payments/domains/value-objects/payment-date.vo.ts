// backend/src/payments/domains/value-objects/payment-date.vo.ts
export class PaymentDate {
  private readonly value: Date;

  constructor(value: Date | string) {
    const date = typeof value === 'string' ? new Date(value) : value;

    if (isNaN(date.getTime())) {
      throw new Error('Invalid payment date');
    }

    if (date > new Date()) {
      throw new Error('Payment date cannot be in the future');
    }

    this.value = date;
  }

  getValue(): Date {
    return this.value;
  }

  toString(): string {
    return this.value.toISOString();
  }

  isSameDay(other: PaymentDate): boolean {
    return this.value.toDateString() === other.getValue().toDateString();
  }
}
