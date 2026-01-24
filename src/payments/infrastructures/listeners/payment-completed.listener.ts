// backend/src/payments/applications/listeners/payment-completed.listener.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PaymentCompletedEvent } from '../events/payment-completed.event';

@Injectable()
export class PaymentCompletedListener {
  private readonly logger = new Logger(PaymentCompletedListener.name);

  @OnEvent('payment.completed')
  async handlePaymentCompleted(event: PaymentCompletedEvent) {
    this.logger.log(`Payment completed: ${event.nomorInvoice}`);

    // TODO: Send completion notification
    // TODO: Update medical record to completed
    // TODO: Generate receipt
    // TODO: Update revenue statistics
  }
}
