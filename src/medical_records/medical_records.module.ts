import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { MedicalRecord } from './domains/entities/medical-record.entity';
import { Appointment } from '../appointments/domains/entities/appointment.entity';

// Controller
import { MedicalRecordsController } from './interface/http/medical_records.controller';

// Orchestrator
import { MedicalRecordsService } from './applications/orchestrator/medical_records.service';

// Use Cases
import { MedicalRecordCreationService } from './applications/use-cases/medical-record-creation.service';
import { MedicalRecordUpdateService } from './applications/use-cases/medical-record-update.service';
import { MedicalRecordFindService } from './applications/use-cases/medical-record-find.service';
import { MedicalRecordSearchService } from './applications/use-cases/medical-record-search.service';
import { MedicalRecordAppointmentFinderService } from './applications/use-cases/medical-record-appointment-finder.service';
import { MedicalRecordDeletionService } from './applications/use-cases/medical-record-deletion.service';

// Domain Services
import { MedicalRecordMapper } from './domains/mappers/medical-record.mappers';
import { MedicalRecordDomainService } from './domains/services/medical-record-domain.service';
import { MedicalRecordAuthorizationService } from './domains/services/medical-record-authorization.service';

// Validators
import { MedicalRecordValidator } from './domains/validators/medical-record.validator';
import { MedicalRecordCreateValidator } from './domains/validators/medical-record-create.validator';
import { MedicalRecordUpdateValidator } from './domains/validators/medical-record-update.validator';
import { MedicalRecordAuthorizationValidator } from './domains/validators/medical-record-authorization.validator';

// Infrastructure
import { MedicalRecordsRepository } from './infrastructure/persistence/repositories/medical-records.repository';
import { MedicalRecordQueryBuilder } from './infrastructure/persistence/query/medical-record-query.builder';
import { TransactionManager } from './infrastructure/transactions/transaction.manager';
import { MedicalRecordEventListener } from './infrastructure/listeners/medical-record.event-listener';

@Module({
  imports: [TypeOrmModule.forFeature([MedicalRecord, Appointment])],
  controllers: [MedicalRecordsController],
  providers: [
    // Orchestrator
    MedicalRecordsService,

    // Use Cases
    MedicalRecordCreationService,
    MedicalRecordUpdateService,
    MedicalRecordFindService,
    MedicalRecordSearchService,
    MedicalRecordAppointmentFinderService,
    MedicalRecordDeletionService,

    // Domain Layer
    MedicalRecordMapper,
    MedicalRecordDomainService,
    MedicalRecordAuthorizationService,

    // Validators
    MedicalRecordValidator,
    MedicalRecordCreateValidator,
    MedicalRecordUpdateValidator,
    MedicalRecordAuthorizationValidator,

    // Infrastructure
    MedicalRecordsRepository,
    MedicalRecordQueryBuilder,
    TransactionManager,

    // Event Listeners
    MedicalRecordEventListener,
  ],
  exports: [
    // Export orchestrator for other modules
    MedicalRecordsService,

    // Export repository for direct access if needed
    MedicalRecordsRepository,

    TransactionManager,
  ],
})
export class MedicalRecordsModule {}
