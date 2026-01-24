import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Entities
import { Appointment } from './domains/entities/appointment.entity';
import { Patient } from '../patients/domains/entities/patient.entity';
import { User } from '../users/domains/entities/user.entity';

// Interface Layer
import { AppointmentsController } from './interface/http/appointments.controller';
import { PublicAppointmentsController } from './interface/http/public-appointments.controller';

// Application Layer
import { AppointmentsService } from './applications/orchestrator/appointments.service';
import { AppointmentCreationService } from './applications/use-cases/appointment-creation.service';
import { AppointmentCompletionService } from './applications/use-cases/appointment-completion.service';
import { AppointmentCancellationService } from './applications/use-cases/appointment-cancellation.service';
import { AppointmentFindService } from './applications/use-cases/appointment-find.service';
import { AppointmentSearchService } from './applications/use-cases/appointment-search.service';
import { AppointmentUpdateService } from './applications/use-cases/appointment-update.service';
import { AppointmentDeletionService } from './applications/use-cases/appointment-deletion.service';
import { PublicBookingService } from './applications/use-cases/public-booking.service';

// Domain Layer
import { AppointmentMapper } from './domains/mappers/appointment.mapper';
import { AppointmentDomainService } from './domains/services/appointment-domain.service';
import { AppointmentValidator } from './domains/validators/appointment.validator';
import { AppointmentCreateValidator } from './domains/validators/appointment-create.validator';
import { AppointmentTimeValidator } from './domains/validators/appointment-time.validator';
import { AppointmentConflictValidator } from './domains/validators/appointment-conflict.validator';
import { AppointmentCancellationValidator } from './domains/validators/appointment-cancellation.validator';

// Infrastructure Layer
import { AppointmentsRepository } from './infrastructures/persistence/repositories/appointments.repository';
import { AppointmentQueryBuilder } from './infrastructures/persistence/query/appointment-query.builder';
import { TransactionManager } from './infrastructures/transactions/transaction.manager';
import { AppointmentEventListener } from './infrastructures/listeners/appointment.event-listener';

// External Modules
import { NotificationsModule } from '../notifications/notifications.module';
import { PatientsModule } from '../patients/patients.module'; // IMPORT PATIENTS MODULE
import { MedicalRecordsModule } from '../medical_records/medical_records.module';
import { TreatmentsModule } from '../treatments/treatments.module';
import { MedicalRecordTreatmentsModule } from '../medical-record-treatments/medical-record-treatments.module';
import { PaymentsModule } from '../payments/payments.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, Patient, User]),
    EventEmitterModule.forRoot(),
    NotificationsModule,
    PatientsModule,
    MedicalRecordsModule,
    TreatmentsModule,
    MedicalRecordTreatmentsModule,
    PaymentsModule,
    UsersModule,
  ],
  controllers: [
    AppointmentsController,
    PublicAppointmentsController, // REGISTER PUBLIC CONTROLLER
  ],
  providers: [
    // Orchestrator
    AppointmentsService,

    // Use Cases
    AppointmentCreationService,
    AppointmentCompletionService,
    AppointmentCancellationService,
    AppointmentFindService,
    AppointmentSearchService,
    AppointmentUpdateService,
    AppointmentDeletionService,
    PublicBookingService,

    // Domain Services
    AppointmentDomainService,
    AppointmentMapper,

    // Validators
    AppointmentValidator,
    AppointmentCreateValidator,
    AppointmentTimeValidator,
    AppointmentConflictValidator,
    AppointmentCancellationValidator,

    // Infrastructure
    AppointmentsRepository,
    AppointmentQueryBuilder,
    TransactionManager,
    AppointmentEventListener,
  ],
  exports: [AppointmentsService, AppointmentsRepository],
})
export class AppointmentsModule {}
