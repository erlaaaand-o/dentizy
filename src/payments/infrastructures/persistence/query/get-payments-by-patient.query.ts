// backend/src/payments/infrastructures/persistence/queries/get-payments-by-patient.query.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../../../domains/entities/payments.entity';

@Injectable()
export class GetPaymentsByPatientQuery {
  constructor(
    @InjectRepository(Payment)
    private readonly repository: Repository<Payment>,
  ) {}

  async execute(patientId: string, limit: number = 10): Promise<Payment[]> {
    return await this.repository.find({
      where: { patientId },
      order: { tanggalPembayaran: 'DESC' },
      take: limit,
    });
  }
}
