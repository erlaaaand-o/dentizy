// backend/src/payments/domains/events/payment-completed.event.ts
export class PaymentCompletedEvent {
  constructor(
    public readonly paymentId: string,
    public readonly medicalRecordId: string,
    public readonly patientId: string,
    public readonly patientEmail: string | null,
    public readonly patientName: string,
    public readonly nomorInvoice: string,
    public readonly totalAmount: number,
    public readonly totalAkhir: number,
    public readonly completedAt: Date,
    public readonly paymentDate: Date,
    public readonly paymentMethod: string,
  ) {}
}
