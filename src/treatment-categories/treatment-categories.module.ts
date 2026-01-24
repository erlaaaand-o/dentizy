// backend/src/treatment-categories/treatment-categories.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Entities
import { TreatmentCategory } from './domains/entities/treatment-categories.entity';

// Controllers
import { TreatmentCategoriesController } from './interface/http/treatment-categories.controller';

// Services
import { TreatmentCategoriesService } from './applications/orchestrator/treatment-categories.service';
import { TreatmentCategoryDomainService } from './domains/services/treatment-category.domain-service';

// Use Cases
import { CreateTreatmentCategoryUseCase } from './applications/use-cases/create-treatment-category.usecase';
import { UpdateTreatmentCategoryUseCase } from './applications/use-cases/update-treatment-category.usecase';
import { DeleteTreatmentCategoryUseCase } from './applications/use-cases/delete-treatment-category.usecase';
import { FindTreatmentCategoriesUseCase } from './applications/use-cases/find-treatment-categories.usecase';
import { RestoreTreatmentCategoryUseCase } from './applications/use-cases/restore-treatment-category.usecase';

// Repositories & Queries
import { TreatmentCategoryRepository } from './infrastructures/persistence/repositories/treatment-category.repository';
import { TreatmentCategoryQueries } from './infrastructures/persistence/query/treatment-category.queries';
import { TreatmentCategoryTransactionManager } from './infrastructures/transactions/treatment-category-transaction.manager';

// Mappers & Validators
import { TreatmentCategoryMapper } from './domains/mappers/treatment-category.mapper';
import { TreatmentCategoryValidator } from './domains/validators/treatment-category.validator';

// Event Listeners
import { TreatmentCategoryCreatedListener } from './infrastructures/listeners/treatment-category-created.listener';
import { TreatmentCategoryUpdatedListener } from './infrastructures/listeners/treatment-category-updated.listener';
import { TreatmentCategoryDeletedListener } from './infrastructures/listeners/treatment-category-deleted.listener';
import { TreatmentCategoryRestoredListener } from './infrastructures/listeners/treatment-category-restored.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([TreatmentCategory]),
    EventEmitterModule.forRoot(),
  ],
  controllers: [TreatmentCategoriesController],
  providers: [
    // Main Service
    TreatmentCategoriesService,

    // Domain Services
    TreatmentCategoryDomainService,

    // Use Cases
    CreateTreatmentCategoryUseCase,
    UpdateTreatmentCategoryUseCase,
    DeleteTreatmentCategoryUseCase,
    FindTreatmentCategoriesUseCase,
    RestoreTreatmentCategoryUseCase,

    // Repositories & Queries
    TreatmentCategoryRepository,
    TreatmentCategoryQueries,
    TreatmentCategoryTransactionManager,

    // Mappers & Validators
    TreatmentCategoryMapper,
    TreatmentCategoryValidator,

    // Event Listeners
    TreatmentCategoryCreatedListener,
    TreatmentCategoryUpdatedListener,
    TreatmentCategoryDeletedListener,
    TreatmentCategoryRestoredListener,
  ],
  exports: [
    TreatmentCategoriesService,
    TreatmentCategoryRepository,
    TreatmentCategoryDomainService,
  ],
})
export class TreatmentCategoriesModule {}
