// backend/src/payments/infrastructures/persistence/queries/get-payment-by-invoice.query.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../../../domains/entities/payments.entity';

@Injectable()
export class GetPaymentByInvoiceQuery {
  constructor(
    @InjectRepository(Payment)
    private readonly repository: Repository<Payment>,
  ) {}

  async execute(nomorInvoice: string): Promise<Payment> {
    const payment = await this.repository.findOne({
      where: { nomorInvoice },
    });

    if (!payment) {
      throw new NotFoundException(
        `Pembayaran dengan nomor invoice ${nomorInvoice} tidak ditemukan`,
      );
    }

    return payment;
  }
}
