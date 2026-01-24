// backend/src/payments/infrastructures/persistence/queries/get-payment-statistics.query.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Payment,
  StatusPembayaran,
} from '../../../domains/entities/payments.entity';

export interface PaymentStatistics {
  totalPayments: number;
  totalRevenue: number;
  totalPending: number;
  totalCompleted: number;
  totalCancelled: number;
  totalPartial: number;
  averagePayment: number;
}

@Injectable()
export class GetPaymentStatisticsQuery {
  constructor(
    @InjectRepository(Payment)
    private readonly repository: Repository<Payment>,
  ) {}

  async execute(startDate?: Date, endDate?: Date): Promise<PaymentStatistics> {
    const queryBuilder = this.repository
      .createQueryBuilder('payment')
      .where('payment.deletedAt IS NULL');

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'payment.tanggalPembayaran BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate,
        },
      );
    }

    const payments = await queryBuilder.getMany();

    const totalPayments = payments.length;
    const totalRevenue = payments
      .filter((p) => p.statusPembayaran === StatusPembayaran.LUNAS)
      .reduce((sum, p) => sum + Number(p.totalAkhir), 0);

    const totalPending = payments.filter(
      (p) => p.statusPembayaran === StatusPembayaran.PENDING,
    ).length;
    const totalCompleted = payments.filter(
      (p) => p.statusPembayaran === StatusPembayaran.LUNAS,
    ).length;
    const totalCancelled = payments.filter(
      (p) => p.statusPembayaran === StatusPembayaran.DIBATALKAN,
    ).length;
    const totalPartial = payments.filter(
      (p) => p.statusPembayaran === StatusPembayaran.SEBAGIAN,
    ).length;

    const averagePayment =
      totalCompleted > 0 ? totalRevenue / totalCompleted : 0;

    return {
      totalPayments,
      totalRevenue,
      totalPending,
      totalCompleted,
      totalCancelled,
      totalPartial,
      averagePayment,
    };
  }
}
