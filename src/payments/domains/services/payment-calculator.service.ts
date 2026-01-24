// backend/src/payments/domains/services/payment-calculator.service.ts
import { Injectable } from '@nestjs/common';

import { StatusPembayaran } from '../../domains/entities/payments.entity';

export interface PaymentCalculation {
  totalAkhir: number;
  kembalian: number;
  statusPembayaran: StatusPembayaran;
}

@Injectable()
export class PaymentCalculatorService {
  calculate(
    totalBiaya: number,
    jumlahBayar: number,
    currentStatus?: StatusPembayaran,
  ): PaymentCalculation {
    const totalAkhir = totalBiaya;
    const kembalian = Math.max(0, jumlahBayar - totalAkhir);

    let statusPembayaran: StatusPembayaran;

    if (currentStatus === StatusPembayaran.DIBATALKAN) {
      statusPembayaran = StatusPembayaran.DIBATALKAN;
    } else if (jumlahBayar >= totalAkhir) {
      statusPembayaran = StatusPembayaran.LUNAS;
    } else if (jumlahBayar > 0) {
      statusPembayaran = StatusPembayaran.SEBAGIAN;
    } else {
      statusPembayaran = StatusPembayaran.PENDING;
    }

    return {
      totalAkhir,
      kembalian,
      statusPembayaran,
    };
  }

  validatePaymentAmount(
    totalBiaya: number,
    diskonTotal: number,
    jumlahBayar: number,
  ): { valid: boolean; message?: string } {
    if (totalBiaya < 0) {
      return { valid: false, message: 'Total biaya tidak boleh negatif' };
    }

    if (diskonTotal < 0) {
      return { valid: false, message: 'Diskon tidak boleh negatif' };
    }

    if (diskonTotal > totalBiaya) {
      return {
        valid: false,
        message: 'Diskon tidak boleh lebih besar dari total biaya',
      };
    }

    if (jumlahBayar < 0) {
      return { valid: false, message: 'Jumlah bayar tidak boleh negatif' };
    }

    return { valid: true };
  }
}
