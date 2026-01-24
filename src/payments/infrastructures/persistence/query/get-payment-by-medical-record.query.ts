// backend/src/payments/infrastructures/persistence/queries/get-payment-by-medical-record.query.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../../../domains/entities/payments.entity';

@Injectable()
export class GetPaymentByMedicalRecordQuery {
  constructor(
    @InjectRepository(Payment)
    private readonly repository: Repository<Payment>,
  ) {}

  async execute(medicalRecordId: string): Promise<Payment | null> {
    return await this.repository.findOne({
      where: { medicalRecordId },
      order: { createdAt: 'DESC' },
    });
  }
}
