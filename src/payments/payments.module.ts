// backend/src/payments/payments.module.ts
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entity

// Controller

// Service & Use Cases
import { PaymentsService } from './applications/orchestrator/payments.service';
import { CancelPaymentUseCase } from './applications/use-cases/cancel-payment.use-case';
import { CreatePaymentUseCase } from './applications/use-cases/create-payment.use-case';
import { DeletePaymentUseCase } from './applications/use-cases/delete-payment.use-case';
import { GetPaymentDetailUseCase } from './applications/use-cases/get-payment-detail.use-case';
import { GetPaymentListUseCase } from './applications/use-cases/get-payment-list.use-case';
import { UpdatePaymentUseCase } from './applications/use-cases/update-payment.use-case';
import { Payment } from './domains/entities/payments.entity';

// Domain Services

// Repository & Queries

// Transaction Service
import { PaymentTransactionService } from './infrastructures/transactions/payment-transaction.service';

// Mappers
import { PaymentMapper } from './domains/mappers/payment.mapper';
import { PaymentSummaryMapper } from './domains/mappers/payment-summary.mapper';
import { InvoiceGeneratorService } from './domains/services/invoice-generator.service';
import { PaymentCalculatorService } from './domains/services/payment-calculator.service';
import { PaymentValidatorService } from './domains/services/payment-validator.service';

// Event Listeners
import { PaymentCancelledListener } from './infrastructures/listeners/payment-cancelled.listener';
import { PaymentCompletedListener } from './infrastructures/listeners/payment-completed.listener';
import { PaymentCreatedListener } from './infrastructures/listeners/payment-created.listener';
import { PaymentDeletedListener } from './infrastructures/listeners/payment-deleted.listener';
import { PaymentUpdatedListener } from './infrastructures/listeners/payment-updated.listener';
import { GetPaymentByInvoiceQuery } from './infrastructures/persistence/query/get-payment-by-invoice.query';
import { GetPaymentByMedicalRecordQuery } from './infrastructures/persistence/query/get-payment-by-medical-record.query';
import { GetPaymentStatisticsQuery } from './infrastructures/persistence/query/get-payment-statistics.query';
import { GetPaymentsByPatientQuery } from './infrastructures/persistence/query/get-payments-by-patient.query';
import { GetRevenueByPeriodQuery } from './infrastructures/persistence/query/get-revenue-by-period.query';
import { PaymentRepository } from './infrastructures/persistence/repositories/payment.repository';
import { PaymentsController } from './interface/http/payments.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Payment]), EventEmitterModule.forRoot()],
  controllers: [PaymentsController],
  providers: [
    // Main Service
    PaymentsService,

    // Use Cases
    CreatePaymentUseCase,
    UpdatePaymentUseCase,
    CancelPaymentUseCase,
    DeletePaymentUseCase,
    GetPaymentListUseCase,
    GetPaymentDetailUseCase,

    // Domain Services
    InvoiceGeneratorService,
    PaymentCalculatorService,
    PaymentValidatorService,

    // Repository & Queries
    PaymentRepository,
    GetPaymentByInvoiceQuery,
    GetPaymentByMedicalRecordQuery,
    GetPaymentStatisticsQuery,
    GetRevenueByPeriodQuery,
    GetPaymentsByPatientQuery,

    // Transaction Service
    PaymentTransactionService,

    // Mappers
    PaymentMapper,
    PaymentSummaryMapper,

    // Event Listeners
    PaymentCreatedListener,
    PaymentUpdatedListener,
    PaymentCancelledListener,
    PaymentCompletedListener,
    PaymentDeletedListener,
  ],
  exports: [
    PaymentsService,
    PaymentRepository,
    PaymentCalculatorService,
    PaymentValidatorService,
    InvoiceGeneratorService,
  ],
})
export class PaymentsModule {}
