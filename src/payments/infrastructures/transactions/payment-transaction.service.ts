import { Injectable } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import {
  Payment,
  StatusPembayaran,
} from '../../domains/entities/payments.entity';

interface RelatedUpdates {
  medicalRecordUpdate?: {
    id: number;
    status?: string;
    [key: string]: unknown;
  };
}

interface RefundData {
  refundAmount: number;
  refundMethod: string;
  refundNotes?: string;
}

@Injectable()
export class PaymentTransactionService {
  constructor(private readonly dataSource: DataSource) {}

  async executeInTransaction<T>(
    callback: (queryRunner: QueryRunner) => Promise<T>,
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await callback(queryRunner);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async createPaymentWithRelatedUpdates(
    paymentData: Partial<Payment>,
    relatedUpdates: RelatedUpdates,
  ): Promise<Payment> {
    return await this.executeInTransaction(async (queryRunner) => {
      const paymentRepo = queryRunner.manager.getRepository(Payment);

      // Create payment
      const payment = paymentRepo.create(paymentData);
      const savedPayment = await paymentRepo.save(payment);

      // Update medical record if needed
      if (relatedUpdates.medicalRecordUpdate) {
        // TODO: Update medical record status
        // const medicalRecordRepo = queryRunner.manager.getRepository(MedicalRecord);
        // await medicalRecordRepo.update(
        //   relatedUpdates.medicalRecordUpdate.id,
        //   relatedUpdates.medicalRecordUpdate
        // );
      }

      return savedPayment;
    });
  }

  async cancelPaymentWithRefund(
    paymentId: string,
    refundData?: RefundData,
  ): Promise<Payment> {
    return await this.executeInTransaction(async (queryRunner) => {
      const paymentRepo = queryRunner.manager.getRepository(Payment);

      // Get payment
      const payment = await paymentRepo.findOne({ where: { id: paymentId } });
      if (!payment) {
        throw new Error('Payment not found');
      }

      // Update payment status
      payment.statusPembayaran = StatusPembayaran.DIBATALKAN;
      const updatedPayment = await paymentRepo.save(payment);

      // Process refund if needed
      if (refundData) {
        // TODO: Create refund record
        // const refundRepo = queryRunner.manager.getRepository(Refund);
        // await refundRepo.save({
        //   paymentId: payment.id,
        //   amount: refundData.refundAmount,
        //   method: refundData.refundMethod,
        //   notes: refundData.refundNotes,
        // });
      }

      // Revert medical record status
      // TODO: Update medical record
      // const medicalRecordRepo = queryRunner.manager.getRepository(MedicalRecord);
      // await medicalRecordRepo.update(payment.medicalRecordId, { status: 'unpaid' });

      return updatedPayment;
    });
  }

  async batchUpdatePaymentStatus(
    paymentIds: number[],
    newStatus: StatusPembayaran,
  ): Promise<Payment[]> {
    return await this.executeInTransaction(async (queryRunner) => {
      const paymentRepo = queryRunner.manager.getRepository(Payment);

      const payments = await paymentRepo.findByIds(paymentIds);

      payments.forEach((payment) => {
        payment.statusPembayaran = newStatus;
      });

      return await paymentRepo.save(payments);
    });
  }
}
