// backend/src/payments/applications/use-cases/get-payment-detail.use-case.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentRepository } from '../../infrastructures/persistence/repositories/payment.repository';
import { PaymentResponseDto } from '../dto/payment-response.dto';
import { PaymentMapper } from '../../domains/mappers/payment.mapper';

@Injectable()
export class GetPaymentDetailUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentMapper: PaymentMapper,
  ) {}

  async execute(id: string): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findOne(id);

    if (!payment) {
      throw new NotFoundException(`Pembayaran dengan ID ${id} tidak ditemukan`);
    }

    return this.paymentMapper.toResponseDto(payment);
  }
}
