import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  Payment,
  StatusPembayaran,
} from '../../../domains/entities/payments.entity';

export interface RevenuePeriod {
  period: string;
  revenue: number;
  count: number;
}

type RawRevenuePeriod = {
  period: string;
  revenue: string | null;
  count: string | null;
};

@Injectable()
export class GetRevenueByPeriodQuery {
  constructor(
    @InjectRepository(Payment)
    private readonly repository: Repository<Payment>,
  ) {}

  async execute(
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'month' | 'year' = 'day',
  ): Promise<RevenuePeriod[]> {
    let dateFormat: string;

    switch (groupBy) {
      case 'year':
        dateFormat = '%Y';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      case 'day':
      default:
        dateFormat = '%Y-%m-%d';
        break;
    }

    const result: RawRevenuePeriod[] = await this.repository
      .createQueryBuilder('payment')
      .select(
        `DATE_FORMAT(payment.tanggalPembayaran, '${dateFormat}')`,
        'period',
      )
      .addSelect('SUM(payment.totalAkhir)', 'revenue')
      .addSelect('COUNT(payment.id)', 'count')
      .where('payment.statusPembayaran = :status', {
        status: StatusPembayaran.LUNAS,
      })
      .andWhere('payment.tanggalPembayaran BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('payment.deletedAt IS NULL')
      .groupBy('period')
      .orderBy('period', 'ASC')
      .getRawMany<RawRevenuePeriod>();

    return result.map((r) => ({
      period: r.period,
      revenue: parseFloat(r.revenue ?? '0'),
      count: parseInt(r.count ?? '0', 10),
    }));
  }
}
