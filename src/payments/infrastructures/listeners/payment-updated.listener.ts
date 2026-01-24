// backend/src/payments/applications/listeners/payment-updated.listener.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PaymentUpdatedEvent } from '../events/payment-updated.event';

@Injectable()
export class PaymentUpdatedListener {
  private readonly logger = new Logger(PaymentUpdatedListener.name);

  @OnEvent('payment.updated')
  async handlePaymentUpdated(event: PaymentUpdatedEvent) {
    this.logger.log(
      `Payment ${event.paymentId} updated: ${event.previousStatus} -> ${event.newStatus}`,
    );

    // TODO: Send notification if status changed
    // TODO: Update related records
    // TODO: Log audit trail
  }
}
