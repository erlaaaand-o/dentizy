import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';

// Entities
import { Patient } from './domains/entities/patient.entity';

// Controllers
import { PatientsController } from './interface/http/patients.controller';

// Orchestrator Service
import { PatientsService } from './application/orchestrator/patients.service';

// Use Cases
import { PatientCreationService } from './application/use-cases/patient-creation.service';
import { PatientFindService } from './application/use-cases/patient-find.service';
import { PatientSearchService } from './application/use-cases/patient-search.service';
import { PatientUpdateService } from './application/use-cases/patient-update.service';
import { PatientDeletionService } from './application/use-cases/patient-deletion.service';
import { PatientRestoreService } from './application/use-cases/patient-restore.service';
import { PatientStatisticsService } from './application/use-cases/patient-statistics.service';
import { PatientCleanupService } from './application/use-cases/patient-cleanup.service'; // IMPORT INI

// Validators
import { PatientCreateValidator } from './domains/validators/patient-create.validator';
import { PatientUpdateValidator } from './domains/validators/patient-update.validator';
import { PatientSearchValidator } from './domains/validators/patient-search.validator';
import { PatientFieldValidator } from './domains/validators/patient-field.validator';

// Infrastructure
import { PatientRepository } from './infrastructure/persistence/repositories/patients.repository';
import { PatientQueryBuilder } from './infrastructure/persistence/query/patient-query.builder';
import { MedicalRecordNumberGenerator } from './infrastructure/generator/medical-record-number.generator';
import { PatientEventListener } from './infrastructure/listeners/patient.event-listener';
import { PatientCacheService } from './infrastructure/cache/patient-cache.service';
import { TransactionManager } from './infrastructure/transactions/transaction.manager';

// Domain
import { PatientValidator } from './domains/validators/patient.validator';
import { PatientMapper } from './domains/mappers/patient.mapper';

@Module({
  imports: [
    TypeOrmModule.forFeature([Patient]),

    // Cache configuration
    CacheModule.register({
      ttl: 300000, // 5 minutes in milliseconds
      max: 100, // maximum number of items in cache
    }),

    // Event emitter untuk real-time updates
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),

    // Rate limiting untuk search endpoint
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 30, // max 30 requests per minute
      },
    ]),
  ],
  controllers: [PatientsController],
  providers: [
    // Orchestrator
    PatientsService,

    // Use Cases
    PatientCreationService,
    PatientFindService,
    PatientSearchService,
    PatientUpdateService,
    PatientDeletionService,
    PatientRestoreService,
    PatientStatisticsService,
    PatientCleanupService,

    // Infrastructure
    PatientRepository,
    PatientQueryBuilder,
    MedicalRecordNumberGenerator,
    PatientEventListener,
    PatientCacheService,
    TransactionManager,

    // Domain
    PatientValidator,
    PatientMapper,

    // Validators
    PatientFieldValidator,
    PatientCreateValidator,
    PatientUpdateValidator,
    PatientSearchValidator,
    PatientValidator,
  ],
  exports: [
    PatientsService,
    PatientRepository,
    PatientValidator,
    PatientCreationService,
  ],
})
export class PatientsModule {}
