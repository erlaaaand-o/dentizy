// backend/src/payments/applications/use-cases/update-payment.use-case.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { PaymentRepository } from '../../infrastructures/persistence/repositories/payment.repository';
import { UpdatePaymentDto } from '../dto/update-payment.dto';
import { PaymentResponseDto } from '../dto/payment-response.dto';
import { PaymentMapper } from '../../domains/mappers/payment.mapper';
import { PaymentCalculatorService } from '../../domains/services/payment-calculator.service';
import { PaymentValidatorService } from '../../domains/services/payment-validator.service';
import { PaymentUpdatedEvent } from '../../infrastructures/events/payment-updated.event';
import { PaymentCompletedEvent } from '../../infrastructures/events/payment-completed.event';
import { StatusPembayaran } from '../../domains/entities/payments.entity';

@Injectable()
export class UpdatePaymentUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentMapper: PaymentMapper,
    private readonly calculatorService: PaymentCalculatorService,
    private readonly validatorService: PaymentValidatorService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    id: string,
    dto: UpdatePaymentDto,
    updatedBy?: string,
  ): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findOne(id);

    if (!payment) {
      throw new NotFoundException(`Pembayaran dengan ID ${id} tidak ditemukan`);
    }

    this.validatorService.validateForUpdate(payment);

    const previousStatus = payment.statusPembayaran;

    const totalBiaya = dto.totalBiaya ?? payment.totalBiaya;
    const jumlahBayar = dto.jumlahBayar ?? payment.jumlahBayar;

    this.validatorService.validatePaymentData({
      totalBiaya: Number(totalBiaya),
      jumlahBayar: Number(jumlahBayar),
    });

    const calculation = this.calculatorService.calculate(
      Number(totalBiaya),
      Number(jumlahBayar),
      payment.statusPembayaran,
    );

    const kembalian = jumlahBayar - payment.totalAkhir;

    const repoPayload = {
      ...dto,
      statusPembayaran: calculation.statusPembayaran,
      kembalian,
      tanggalPembayaran: dto.tanggalPembayaran ?? new Date(),
    };

    const updatedPayment = await this.paymentRepository.update(
      id,
      repoPayload,
      updatedBy,
    );
    const response = this.paymentMapper.toResponseDto(updatedPayment);

    this.eventEmitter.emit(
      'payment.updated',
      new PaymentUpdatedEvent(
        updatedPayment.id,
        previousStatus,
        updatedPayment.statusPembayaran,
        updatedBy,
      ),
    );

    if (
      previousStatus !== StatusPembayaran.LUNAS &&
      updatedPayment.statusPembayaran === StatusPembayaran.LUNAS
    ) {
      this.eventEmitter.emit(
        'payment.completed',
        new PaymentCompletedEvent(
          updatedPayment.id,
          updatedPayment.medicalRecordId,
          updatedPayment.patientId,
          updatedPayment.patient?.email ?? null,
          updatedPayment.patient?.nama_lengkap ?? '',
          updatedPayment.nomorInvoice,
          Number(updatedPayment.totalBiaya),
          Number(updatedPayment.totalAkhir),
          updatedPayment.updatedAt,
          updatedPayment.tanggalPembayaran,
          updatedPayment.metodePembayaran,
        ),
      );
    }

    return response;
  }
}
