// backend/src/payments/applications/events/payment-cancelled.event.ts
export class PaymentCancelledEvent {
  constructor(
    public readonly paymentId: string,
    public readonly nomorInvoice: string,
    public readonly patientName: string,
    public readonly patientEmail: string | null, // Email pasien untuk notifikasi
    public readonly totalAmount: number,
    public readonly cancelledAt: Date,
    public readonly reason?: string,
    public readonly medicalRecordId?: string, // Jika perlu revert status
  ) {}
}
