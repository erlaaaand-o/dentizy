// backend/src/medical-record-treatments/medical-record-treatments.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Controllers
import { MedicalRecordTreatmentsController } from './interface/http/medical-record-treatments.controller';

// Services & Orchestrators
import { MedicalRecordTreatmentsService } from './applications/orchestrator/medical-record-treatments.service';

// Use Cases
import { CreateMedicalRecordTreatmentUseCase } from './applications/use-cases/create-medical-record-treatment.use-case';
import { UpdateMedicalRecordTreatmentUseCase } from './applications/use-cases/update-medical-record-treatment.use-case';
import { DeleteMedicalRecordTreatmentUseCase } from './applications/use-cases/delete-medical-record-treatment.use-case';
import { FindAllMedicalRecordTreatmentsUseCase } from './applications/use-cases/find-all-medical-record-treatments.use-case';
import { FindOneMedicalRecordTreatmentUseCase } from './applications/use-cases/find-one-medical-record-treatment.use-case';
import { FindByMedicalRecordIdUseCase } from './applications/use-cases/find-by-medical-record-id.use-case';
import { GetTotalByMedicalRecordIdUseCase } from './applications/use-cases/get-total-by-medical-record-id.use-case';

// Mappers
import { MedicalRecordTreatmentMapper } from './domains/mappers/medical-record-treatment.mapper';

// Domain Services
import { MedicalRecordTreatmentCalculatorService } from './domains/services/medical-record-treatment-calculator.service';
import { MedicalRecordTreatmentValidatorService } from './domains/services/medical-record-treatment-validator.service';

// Listeners
import { MedicalRecordTreatmentListener } from './infrastructures/listeners/medical-record-treatment.listener';

// Entities
import { MedicalRecordTreatment } from './domains/entities/medical-record-treatments.entity';

// Repositories
import { MedicalRecordTreatmentRepository } from './infrastructures/persistence/repositories/medical-record-treatment.repository';

// Queries
import { MedicalRecordTreatmentQuery } from './infrastructures/persistence/query/medical-record-treatment.query';

// Transactions
import { MedicalRecordTreatmentTransactionService } from './infrastructures/transactions/medical-record-treatment-transaction.service';

// External Modules
import { TreatmentsModule } from '../treatments/treatments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MedicalRecordTreatment]),
    EventEmitterModule.forRoot(),
    TreatmentsModule,
  ],
  controllers: [MedicalRecordTreatmentsController],
  providers: [
    // Orchestrator
    MedicalRecordTreatmentsService,

    // Use Cases
    CreateMedicalRecordTreatmentUseCase,
    UpdateMedicalRecordTreatmentUseCase,
    DeleteMedicalRecordTreatmentUseCase,
    FindAllMedicalRecordTreatmentsUseCase,
    FindOneMedicalRecordTreatmentUseCase,
    FindByMedicalRecordIdUseCase,
    GetTotalByMedicalRecordIdUseCase,

    // Mappers
    MedicalRecordTreatmentMapper,

    // Domain Services
    MedicalRecordTreatmentCalculatorService,
    MedicalRecordTreatmentValidatorService,

    // Listeners
    MedicalRecordTreatmentListener,

    // Repositories
    MedicalRecordTreatmentRepository,

    // Queries
    MedicalRecordTreatmentQuery,

    // Transactions
    MedicalRecordTreatmentTransactionService,
  ],
  exports: [
    MedicalRecordTreatmentsService,
    MedicalRecordTreatmentRepository,
    MedicalRecordTreatmentQuery,
    MedicalRecordTreatmentTransactionService,
  ],
})
export class MedicalRecordTreatmentsModule {}
