// backend/src/payments/applications/use-cases/get-payment-list.use-case.ts
import { Injectable } from '@nestjs/common';
import { PaymentRepository } from '../../infrastructures/persistence/repositories/payment.repository';
import { QueryPaymentDto } from '../dto/query-payment.dto';
import { PaymentMapper } from '../../domains/mappers/payment.mapper';

@Injectable()
export class GetPaymentListUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentMapper: PaymentMapper,
  ) {}

  async execute(query: QueryPaymentDto) {
    const { data, total } = await this.paymentRepository.findAll(query);
    const { page = 1, limit = 10 } = query;

    return {
      data: this.paymentMapper.toResponseDtoList(data),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
