// backend/src/payments/domains/events/payment-updated.event.ts
export class PaymentUpdatedEvent {
  constructor(
    public readonly paymentId: string,
    public readonly previousStatus: string,
    public readonly newStatus: string,
    public readonly updatedBy?: string,
  ) {}
}
