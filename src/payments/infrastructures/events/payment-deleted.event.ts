// backend/src/payments/domains/events/payment-deleted.event.ts
export class PaymentDeletedEvent {
  constructor(
    public readonly paymentId: string,
    public readonly nomorInvoice: string,
    public readonly deletedBy?: string,
  ) {}
}
