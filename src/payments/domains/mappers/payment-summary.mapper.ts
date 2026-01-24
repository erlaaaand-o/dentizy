// backend/src/payments/applications/mappers/payment-summary.mapper.ts
import { Injectable } from '@nestjs/common';
import { Payment } from '../entities/payments.entity';

export interface PaymentSummaryDto {
  totalPayments: number;
  totalRevenue: number;
  totalPending: number;
  totalCompleted: number;
  totalCancelled: number;
}

@Injectable()
export class PaymentSummaryMapper {
  toSummaryDto(payments: Payment[]): PaymentSummaryDto {
    const totalPayments = payments.length;
    const totalRevenue = payments
      .filter((p) => p.statusPembayaran === 'lunas')
      .reduce((sum, p) => sum + Number(p.totalAkhir), 0);

    const totalPending = payments.filter(
      (p) => p.statusPembayaran === 'pending',
    ).length;
    const totalCompleted = payments.filter(
      (p) => p.statusPembayaran === 'lunas',
    ).length;
    const totalCancelled = payments.filter(
      (p) => p.statusPembayaran === 'dibatalkan',
    ).length;

    return {
      totalPayments,
      totalRevenue,
      totalPending,
      totalCompleted,
      totalCancelled,
    };
  }
}
