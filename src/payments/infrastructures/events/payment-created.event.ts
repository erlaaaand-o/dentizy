// backend/src/payments/domains/events/payment-created.event.ts
export class PaymentCreatedEvent {
  constructor(
    public readonly paymentId: string,
    public readonly medicalRecordId: string,
    public readonly patientId: string,
    public readonly nomorInvoice: string,
    public readonly totalAkhir: number,
    public readonly statusPembayaran: string,
    public readonly createdBy: string | null,
  ) {}
}
