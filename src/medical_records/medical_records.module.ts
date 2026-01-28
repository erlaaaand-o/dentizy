import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Appointment } from '../appointments/domains/entities/appointment.entity';

import { MedicalRecordsService } from './applications/orchestrator/medical_records.service';
import { MedicalRecordAppointmentFinderService } from './applications/use-cases/medical-record-appointment-finder.service';
import { MedicalRecordCreationService } from './applications/use-cases/medical-record-creation.service';
import { MedicalRecordDeletionService } from './applications/use-cases/medical-record-deletion.service';
import { MedicalRecordFindService } from './applications/use-cases/medical-record-find.service';
import { MedicalRecordSearchService } from './applications/use-cases/medical-record-search.service';
import { MedicalRecordUpdateService } from './applications/use-cases/medical-record-update.service';
import { MedicalRecord } from './domains/entities/medical-record.entity';
import { MedicalRecordMapper } from './domains/mappers/medical-record.mappers';
import { MedicalRecordAuthorizationService } from './domains/services/medical-record-authorization.service';
import { MedicalRecordDomainService } from './domains/services/medical-record-domain.service';
import { MedicalRecordAuthorizationValidator } from './domains/validators/medical-record-authorization.validator';
import { MedicalRecordCreateValidator } from './domains/validators/medical-record-create.validator';
import { MedicalRecordUpdateValidator } from './domains/validators/medical-record-update.validator';
import { MedicalRecordValidator } from './domains/validators/medical-record.validator';
import { MedicalRecordEventListener } from './infrastructure/listeners/medical-record.event-listener';
import { MedicalRecordQueryBuilder } from './infrastructure/persistence/query/medical-record-query.builder';
import { MedicalRecordsRepository } from './infrastructure/persistence/repositories/medical-records.repository';
import { TransactionManager } from './infrastructure/transactions/transaction.manager';
import { MedicalRecordsController } from './interface/http/medical_records.controller';

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
