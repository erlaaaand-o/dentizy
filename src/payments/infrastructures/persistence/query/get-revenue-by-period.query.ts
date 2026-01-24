// backend/src/payments/infrastructures/persistence/queries/get-revenue-by-period.query.ts
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

    const result = await this.repository
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
      .getRawMany();

    return result.map((r) => ({
      period: r.period,
      revenue: parseFloat(r.revenue || 0),
      count: parseInt(r.count || 0),
    }));
  }
}
