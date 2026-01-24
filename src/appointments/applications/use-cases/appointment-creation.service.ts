import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { Appointment } from '../../domains/entities/appointment.entity';
import { AppointmentsRepository } from '../../infrastructures/persistence/repositories/appointments.repository';
import { AppointmentCreateValidator } from '../../domains/validators/appointment-create.validator';
import { AppointmentTimeValidator } from '../../domains/validators/appointment-time.validator';
import { AppointmentConflictValidator } from '../../domains/validators/appointment-conflict.validator';
import { AppointmentDomainService } from '../../domains/services/appointment-domain.service';
import { TransactionManager } from '../../infrastructures/transactions/transaction.manager';
import { AppointmentCreatedEvent } from '../../infrastructures/events';

@Injectable()
export class AppointmentCreationService {
  private readonly logger = new Logger(AppointmentCreationService.name);

  constructor(
    private readonly repository: AppointmentsRepository,
    private readonly createValidator: AppointmentCreateValidator,
    private readonly timeValidator: AppointmentTimeValidator,
    private readonly conflictValidator: AppointmentConflictValidator,
    private readonly domainService: AppointmentDomainService,
    private readonly transactionManager: TransactionManager,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: CreateAppointmentDto): Promise<Appointment> {
    const queryRunner = this.repository.createQueryRunner();

    try {
      const appointment = await this.transactionManager.executeInTransaction(
        queryRunner,
        async (qr) => {
          // 1. Get Entities
          const patient = await this.repository.findPatientByIdInTransaction(
            qr,
            dto.patient_id,
          );
          const doctor = await this.repository.findDoctorByIdInTransaction(
            qr,
            dto.doctor_id,
          );

          // 2. Validasi Role & Eksistensi
          this.createValidator.validateCreateAppointment(
            patient,
            dto.patient_id,
            doctor,
            dto.doctor_id,
          );

          // 3. Validasi Format Waktu
          this.timeValidator.validateAppointmentTime(
            dto.tanggal_janji,
            dto.jam_janji,
          );

          // 4. Hitung Buffer
          const appointmentDate = new Date(dto.tanggal_janji);
          appointmentDate.setHours(0, 0, 0, 0);

          const { bufferStart, bufferEnd } =
            this.timeValidator.calculateBufferWindow(
              appointmentDate,
              dto.jam_janji,
            );

          // 5. VALIDASI KONFLIK DUA ARAH

          // A. Cek Jadwal Dokter (Dokter tidak boleh sibuk)
          await this.conflictValidator.validateDoctorNoConflict(
            qr,
            dto.doctor_id,
            appointmentDate,
            dto.jam_janji,
            bufferStart,
            bufferEnd,
          );

          // B. Cek Jadwal Pasien (Pasien tidak boleh punya jadwal aktif lain di jam sama)
          await this.conflictValidator.validatePatientNoConflict(
            qr,
            dto.patient_id,
            appointmentDate,
            dto.jam_janji,
            bufferStart,
            bufferEnd,
          );

          // 6. Create Entity (patient and doctor are validated to be non-null)
          const appointmentData = this.domainService.createAppointmentEntity(
            dto,
            patient!,
            doctor!,
            appointmentDate,
          );

          return await this.repository.saveInTransaction(qr, appointmentData);
        },
        'create-appointment',
      );

      // 7. Emit Event
      const shouldScheduleReminder =
        this.domainService.shouldScheduleReminder(appointment);
      this.eventEmitter.emit(
        'appointment.created',
        new AppointmentCreatedEvent(appointment, shouldScheduleReminder),
      );

      this.logger.log(`✅ Appointment created: #${appointment.id}`);
      return appointment;
    } catch (error) {
      this.logger.error(
        '❌ Error creating appointment:',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
