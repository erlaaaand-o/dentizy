// backend/src/payments/domains/services/payment-validator.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import {
  Payment,
  StatusPembayaran,
} from '../../domains/entities/payments.entity';

@Injectable()
export class PaymentValidatorService {
  validateForUpdate(payment: Payment): void {
    if (payment.statusPembayaran === StatusPembayaran.DIBATALKAN) {
      throw new BadRequestException(
        'Pembayaran yang sudah dibatalkan tidak dapat diubah',
      );
    }
  }

  validateForCancellation(payment: Payment): void {
    if (payment.statusPembayaran === StatusPembayaran.DIBATALKAN) {
      throw new BadRequestException('Pembayaran sudah dibatalkan');
    }
  }

  validatePaymentData(data: {
    totalBiaya: number;
    diskonTotal?: number;
    jumlahBayar: number;
  }): void {
    const { totalBiaya, diskonTotal = 0, jumlahBayar } = data;

    if (totalBiaya <= 0) {
      throw new BadRequestException('Total biaya harus lebih dari 0');
    }

    if (diskonTotal < 0) {
      throw new BadRequestException('Diskon tidak boleh negatif');
    }

    if (diskonTotal > totalBiaya) {
      throw new BadRequestException(
        'Diskon tidak boleh lebih besar dari total biaya',
      );
    }

    if (jumlahBayar < 0) {
      throw new BadRequestException('Jumlah bayar tidak boleh negatif');
    }
  }
}
