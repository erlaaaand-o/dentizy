// backend/src/treatments/treatments.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Entities
import { Treatment } from './domains/entities/treatments.entity';

// Controller
import { TreatmentsController } from './interface/http/treatments.controller';

// Repositories
import { TreatmentRepository } from './infrastructures/persistence/repositories/treatment.repository';

// Transaction Services
import { TreatmentTransactionService } from './infrastructures/transactions/treatment-transaction.service';

// Use Cases
import { CreateTreatmentUseCase } from './applications/use-cases/create-treatment.use-case';
import { UpdateTreatmentUseCase } from './applications/use-cases/update-treatment.use-case';
import { DeleteTreatmentUseCase } from './applications/use-cases/delete-treatment.use-case';
import { RestoreTreatmentUseCase } from './applications/use-cases/restore-treatment.use-case';
import { GetTreatmentUseCase } from './applications/use-cases/get-treatment.use-case';
import { ListTreatmentsUseCase } from './applications/use-cases/list-treatments.use-case';

// Query Handlers
import { GetTreatmentHandler } from './infrastructures/persistence/query/get-treatment.handler';
import { GetTreatmentByCodeHandler } from './infrastructures/persistence/query/get-treatment-by-code.handler';
import { ListTreatmentsHandler } from './infrastructures/persistence/query/list-treatments.handler';
import { GetActiveTreatmentsHandler } from './infrastructures/persistence/query/get-active-treatments.handler';
import { SearchTreatmentsHandler } from './infrastructures/persistence/query/search-treatments.handler';

// Mappers
import { TreatmentMapper } from './domains/mappers/treatment.mapper';
import { TreatmentCategoryMapper } from './domains/mappers/treatment-category.mapper';

// Domain Services
import { TreatmentValidationService } from './domains/services/treatment-validation.service';
import { TreatmentBusinessService } from './domains/services/treatment-business.service';
import { TreatmentPricingService } from './domains/services/treatment-pricing.service';

// Event Listeners
import { TreatmentCreatedListener } from './infrastructures/listeners/treatment-created.listener';
import { TreatmentUpdatedListener } from './infrastructures/listeners/treatment-updated.listener';
import { TreatmentDeletedListener } from './infrastructures/listeners/treatment-deleted.listener';
import { TreatmentRestoredListener } from './infrastructures/listeners/treatment-restored.listener';
import { TreatmentPriceChangedListener } from './infrastructures/listeners/treatment-price-changed.listener';
import { TreatmentStatusChangedListener } from './infrastructures/listeners/treatment-status-changed.listener';

// Validators
import { IsTreatmentCodeUniqueConstraint } from './domains/validators/is-treatment-code-unique.validator';
import { IsCategoryExistsConstraint } from './domains/validators/is-category-exists.validator';

// External Modules
import { TreatmentCategoriesModule } from '../treatment-categories/treatment-categories.module';
import { GetTreatmentByCodeUseCase } from './applications/use-cases/get-treatment-by-code.use-case';

import { TreatmentsIdGenerator } from './infrastructures/generator/treatments-id.generator'; // Sesuaikan path
import { TreatmentsService } from './applications/orchestrator/treatments.service';

const QueryHandlers = [
  GetTreatmentHandler,
  GetTreatmentByCodeHandler,
  ListTreatmentsHandler,
  GetActiveTreatmentsHandler,
  SearchTreatmentsHandler,
];

const UseCases = [
  CreateTreatmentUseCase,
  UpdateTreatmentUseCase,
  DeleteTreatmentUseCase,
  RestoreTreatmentUseCase,
  GetTreatmentUseCase,
  GetTreatmentByCodeUseCase,
  ListTreatmentsUseCase,
];

const DomainServices = [
  TreatmentValidationService,
  TreatmentBusinessService,
  TreatmentPricingService,
];

const EventListeners = [
  TreatmentCreatedListener,
  TreatmentUpdatedListener,
  TreatmentDeletedListener,
  TreatmentRestoredListener,
  TreatmentPriceChangedListener,
  TreatmentStatusChangedListener,
];

const Mappers = [TreatmentMapper, TreatmentCategoryMapper];

const Generator = [TreatmentsIdGenerator];

const Validators = [
  IsTreatmentCodeUniqueConstraint,
  IsCategoryExistsConstraint,
];

@Module({
  imports: [
    TypeOrmModule.forFeature([Treatment]),
    CqrsModule,
    EventEmitterModule.forRoot(),
    TreatmentCategoriesModule,
  ],
  controllers: [TreatmentsController],
  providers: [
    TreatmentsService,

    // Repository
    TreatmentRepository,

    // Transaction Service
    TreatmentTransactionService,

    // Generator
    ...Generator,

    // Use Cases
    ...UseCases,

    // Query Handlers
    ...QueryHandlers,

    // Mappers
    ...Mappers,

    // Domain Services
    ...DomainServices,

    // Event Listeners
    ...EventListeners,

    // Validators
    ...Validators,
  ],
  exports: [
    TreatmentsService,
    TreatmentRepository,
    TreatmentTransactionService,
    TreatmentMapper,
    TreatmentValidationService,
    TreatmentBusinessService,
    TreatmentPricingService,
    ...UseCases,
  ],
})
export class TreatmentsModule {}
