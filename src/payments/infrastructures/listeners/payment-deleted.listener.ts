// backend/src/payments/applications/listeners/payment-deleted.listener.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PaymentDeletedEvent } from '../events/payment-deleted.event';

@Injectable()
export class PaymentDeletedListener {
  private readonly logger = new Logger(PaymentDeletedListener.name);

  @OnEvent('payment.deleted')
  async handlePaymentDeleted(event: PaymentDeletedEvent) {
    this.logger.log(`Payment deleted: ${event.nomorInvoice}`);

    // TODO: Log audit trail
    // TODO: Archive related documents
  }
}
