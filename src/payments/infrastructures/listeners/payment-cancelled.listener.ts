// backend/src/payments/applications/listeners/payment-cancelled.listener.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { PaymentCancelledEvent } from '../events/payment-cancelled.event';

@Injectable()
export class PaymentCancelledListener {
  private readonly logger = new Logger(PaymentCancelledListener.name);

  @OnEvent('payment.cancelled')
  async handlePaymentCancelled(event: PaymentCancelledEvent) {
    this.logger.log(`Payment cancelled: ${event.nomorInvoice}`);
  }
}
