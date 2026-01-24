// backend/src/payments/applications/use-cases/delete-payment.use-case.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentRepository } from '../../infrastructures/persistence/repositories/payment.repository';
import { PaymentDeletedEvent } from '../../infrastructures/events/payment-deleted.event';

@Injectable()
export class DeletePaymentUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(id: string, deletedBy?: string): Promise<void> {
    const payment = await this.paymentRepository.findOne(id);

    if (!payment) {
      throw new NotFoundException(`Pembayaran dengan ID ${id} tidak ditemukan`);
    }

    await this.paymentRepository.softDelete(id);

    // Emit deleted event
    this.eventEmitter.emit(
      'payment.deleted',
      new PaymentDeletedEvent(payment.id, payment.nomorInvoice, deletedBy),
    );
  }
}
