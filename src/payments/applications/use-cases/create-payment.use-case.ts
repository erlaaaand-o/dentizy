// backend/src/payments/applications/use-cases/create-payment.use-case.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentRepository } from '../../infrastructures/persistence/repositories/payment.repository';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { PaymentResponseDto } from '../dto/payment-response.dto';
import { PaymentMapper } from '../../domains/mappers/payment.mapper';
import { PaymentCalculatorService } from '../../domains/services/payment-calculator.service';
import { PaymentValidatorService } from '../../domains/services/payment-validator.service';
import { PaymentCreatedEvent } from '../../infrastructures/events/payment-created.event';
import { PaymentCompletedEvent } from '../../infrastructures/events/payment-completed.event';
import { StatusPembayaran } from '../../domains/entities/payments.entity';

@Injectable()
export class CreatePaymentUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentMapper: PaymentMapper,
    private readonly calculatorService: PaymentCalculatorService,
    private readonly validatorService: PaymentValidatorService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: CreatePaymentDto): Promise<PaymentResponseDto> {
    // Check for duplicate payment
    const existingPayment = await this.paymentRepository.findByMedicalRecordId(
      dto.medicalRecordId,
    );
    if (existingPayment) {
      throw new ConflictException(
        `Pembayaran untuk rekam medis ID ${dto.medicalRecordId} sudah ada`,
      );
    }

    // Validate payment data
    this.validatorService.validatePaymentData({
      totalBiaya: dto.totalBiaya,
      jumlahBayar: dto.jumlahBayar,
    });

    // Calculate payment details
    const calculation = this.calculatorService.calculate(
      dto.totalBiaya,
      dto.jumlahBayar,
    );

    // Override status with calculated status
    dto.statusPembayaran = calculation.statusPembayaran;

    // Create payment
    const payment = await this.paymentRepository.create(dto);
    const response = this.paymentMapper.toResponseDto(payment);

    // Emit created event
    this.eventEmitter.emit(
      'payment.created',
      new PaymentCreatedEvent(
        payment.id,
        payment.medicalRecordId,
        payment.patientId,
        payment.nomorInvoice,
        Number(payment.totalAkhir),
        payment.statusPembayaran,
        payment.createdBy,
      ),
    );

    // Emit completed event if payment is complete
    if (payment.statusPembayaran === StatusPembayaran.LUNAS) {
      this.eventEmitter.emit(
        'payment.completed',
        new PaymentCompletedEvent(
          payment.id,
          payment.medicalRecordId,
          payment.patientId,
          payment.patient?.email ?? null,
          payment.patient?.nama_lengkap ?? '',
          payment.nomorInvoice,
          Number(payment.totalBiaya),
          Number(payment.totalAkhir),
          payment.updatedAt,
          payment.tanggalPembayaran,
          payment.metodePembayaran,
        ),
      );
    }

    return response;
  }
}
