// backend/src/payments/applications/use-cases/cancel-payment.use-case.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { StatusPembayaran } from '../../domains/entities/payments.entity';
import { PaymentMapper } from '../../domains/mappers/payment.mapper';
import { PaymentValidatorService } from '../../domains/services/payment-validator.service';
import { PaymentCancelledEvent } from '../../infrastructures/events/payment-cancelled.event';
import { PaymentRepository } from '../../infrastructures/persistence/repositories/payment.repository';
import { PaymentResponseDto } from '../dto/payment-response.dto';

@Injectable()
export class CancelPaymentUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentMapper: PaymentMapper,
    private readonly validatorService: PaymentValidatorService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(id: string, cancelledBy?: string): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findOne(id);

    if (!payment) {
      throw new NotFoundException(`Pembayaran dengan ID ${id} tidak ditemukan`);
    }

    // Validate for cancellation
    this.validatorService.validateForCancellation(payment);

    // Cancel payment
    const cancelledPayment = await this.paymentRepository.update(
      id,
      { statusPembayaran: StatusPembayaran.DIBATALKAN },
      cancelledBy,
    );

    const response = this.paymentMapper.toResponseDto(cancelledPayment);

    // Emit cancelled event
    this.eventEmitter.emit(
      'payment.cancelled',
      new PaymentCancelledEvent(
        cancelledPayment.id,
        cancelledPayment.nomorInvoice,
        cancelledPayment.patient?.nama_lengkap,
        cancelledPayment.patient?.email ?? null,
        Number(cancelledPayment.totalAkhir),
        new Date(),
        cancelledPayment.medicalRecordId,
      ),
    );

    return response;
  }
}
