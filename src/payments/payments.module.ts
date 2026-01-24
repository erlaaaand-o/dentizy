// backend/src/payments/payments.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Entity
import { Payment } from './domains/entities/payments.entity';

// Controller
import { PaymentsController } from './interface/http/payments.controller';

// Service & Use Cases
import { PaymentsService } from './applications/orchestrator/payments.service';
import { CreatePaymentUseCase } from './applications/use-cases/create-payment.use-case';
import { UpdatePaymentUseCase } from './applications/use-cases/update-payment.use-case';
import { CancelPaymentUseCase } from './applications/use-cases/cancel-payment.use-case';
import { DeletePaymentUseCase } from './applications/use-cases/delete-payment.use-case';
import { GetPaymentListUseCase } from './applications/use-cases/get-payment-list.use-case';
import { GetPaymentDetailUseCase } from './applications/use-cases/get-payment-detail.use-case';

// Domain Services
import { InvoiceGeneratorService } from './domains/services/invoice-generator.service';
import { PaymentCalculatorService } from './domains/services/payment-calculator.service';
import { PaymentValidatorService } from './domains/services/payment-validator.service';

// Repository & Queries
import { PaymentRepository } from './infrastructures/persistence/repositories/payment.repository';
import { GetPaymentByInvoiceQuery } from './infrastructures/persistence/query/get-payment-by-invoice.query';
import { GetPaymentByMedicalRecordQuery } from './infrastructures/persistence/query/get-payment-by-medical-record.query';
import { GetPaymentStatisticsQuery } from './infrastructures/persistence/query/get-payment-statistics.query';
import { GetRevenueByPeriodQuery } from './infrastructures/persistence/query/get-revenue-by-period.query';
import { GetPaymentsByPatientQuery } from './infrastructures/persistence/query/get-payments-by-patient.query';

// Transaction Service
import { PaymentTransactionService } from './infrastructures/transactions/payment-transaction.service';

// Mappers
import { PaymentMapper } from './domains/mappers/payment.mapper';
import { PaymentSummaryMapper } from './domains/mappers/payment-summary.mapper';

// Event Listeners
import { PaymentCreatedListener } from './infrastructures/listeners/payment-created.listener';
import { PaymentUpdatedListener } from './infrastructures/listeners/payment-updated.listener';
import { PaymentCancelledListener } from './infrastructures/listeners/payment-cancelled.listener';
import { PaymentCompletedListener } from './infrastructures/listeners/payment-completed.listener';
import { PaymentDeletedListener } from './infrastructures/listeners/payment-deleted.listener';

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
