// backend/src/payments/applications/listeners/payment-created.listener.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PaymentCreatedEvent } from '../events/payment-created.event';

@Injectable()
export class PaymentCreatedListener {
  private readonly logger = new Logger(PaymentCreatedListener.name);

  @OnEvent('payment.created')
  async handlePaymentCreated(event: PaymentCreatedEvent) {
    this.logger.log(`Payment created: ${event.nomorInvoice}`);

    // TODO: Send notification to patient
    // TODO: Update medical record status
    // TODO: Trigger invoice generation
    // TODO: Log audit trail
  }
}
