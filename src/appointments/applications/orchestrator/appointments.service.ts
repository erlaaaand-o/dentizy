import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { DataSource, DeepPartial, QueryRunner, In } from 'typeorm';

// DTOs
import { MedicalRecordTreatment } from '../../../medical-record-treatments/domains/entities/medical-record-treatments.entity';
import { MedicalRecord } from '../../../medical_records/domains/entities/medical-record.entity';
import {
  Payment,
  MetodePembayaran,
  StatusPembayaran,
} from '../../../payments/domains/entities/payments.entity';
import { TreatmentsService } from '../../../treatments/applications/orchestrator/treatments.service';
import { Treatment } from '../../../treatments/domains/entities/treatments.entity';
import { User } from '../../../users/domains/entities/user.entity';
import {
  Appointment,
  AppointmentStatus,
} from '../../domains/entities/appointment.entity';
import { AppointmentMapper } from '../../domains/mappers/appointment.mapper';
import {
  AppointmentResponseDto,
  PaginatedAppointmentResponseDto,
} from '../dto/appointment-response.dto';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { FindAppointmentsQueryDto } from '../dto/find-appointments-query.dto';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';

// Entities

// Use Cases
import { AppointmentCancellationService } from '../use-cases/appointment-cancellation.service';
import { AppointmentCompletionService } from '../use-cases/appointment-completion.service';
import { AppointmentCreationService } from '../use-cases/appointment-creation.service';
import { AppointmentDeletionService } from '../use-cases/appointment-deletion.service';
import { AppointmentFindService } from '../use-cases/appointment-find.service';
import { AppointmentSearchService } from '../use-cases/appointment-search.service';
import { AppointmentUpdateService } from '../use-cases/appointment-update.service';

// Service External

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly creationService: AppointmentCreationService,
    private readonly completionService: AppointmentCompletionService,
    private readonly cancellationService: AppointmentCancellationService,
    private readonly findService: AppointmentFindService,
    private readonly searchService: AppointmentSearchService,
    private readonly updateService: AppointmentUpdateService,
    private readonly deletionService: AppointmentDeletionService,
    private readonly mapper: AppointmentMapper,
    private readonly treatmentsService: TreatmentsService,
  ) {}

  // --- Standard Methods ---
  async create(dto: CreateAppointmentDto): Promise<AppointmentResponseDto> {
    const appointment = await this.creationService.execute(dto);
    return this.mapper.toResponseDto(appointment);
  }

  async complete(id: string, user: User): Promise<AppointmentResponseDto> {
    const appointment = await this.completionService.execute(id, user);
    return this.mapper.toResponseDto(appointment);
  }

  async cancel(id: string, user: User): Promise<AppointmentResponseDto> {
    const appointment = await this.cancellationService.execute(id, user);
    return this.mapper.toResponseDto(appointment);
  }

  async findAll(
    user: User,
    queryDto: FindAppointmentsQueryDto,
  ): Promise<PaginatedAppointmentResponseDto> {
    const result = await this.searchService.execute(user, queryDto);
    return this.mapper.toPaginatedResponse(
      result.data,
      result.count,
      result.page,
      result.limit,
    );
  }

  async findOne(id: string, user: User): Promise<AppointmentResponseDto> {
    const appointment = await this.findService.execute(id, user);
    return this.mapper.toResponseDto(appointment);
  }

  async update(
    id: string,
    dto: UpdateAppointmentDto,
    user?: User,
  ): Promise<AppointmentResponseDto> {
    if (
      dto.status === AppointmentStatus.SELESAI &&
      dto.medical_record &&
      user
    ) {
      return this.handleCompletionWithMedicalRecord(id, dto, user);
    }
    const appointment = await this.updateService.execute(id, dto);
    return this.mapper.toResponseDto(appointment);
  }

  async remove(id: string, user: User): Promise<void> {
    await this.deletionService.execute(id, user);
  }

  // --- PRIVATE METHODS (FULL DIRECT TRANSACTION) ---

  private async handleCompletionWithMedicalRecord(
    id: string,
    dto: UpdateAppointmentDto,
    user: User,
  ): Promise<AppointmentResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Fetch Appointment with relations
      const existingAppt = await this.findAppointmentInTransaction(
        queryRunner,
        id,
      );

      // 2. Validate status
      this.validateAppointmentForCompletion(existingAppt);

      // 3. Create Medical Record
      const savedMedicalRecord = await this.createMedicalRecord(
        queryRunner,
        id,
        existingAppt,
        dto,
      );

      // 4. Process Treatments and Calculate Total
      // Note: Menggunakan array kosong sebagai fallback jika undefined
      const treatmentIds = dto.medical_record?.treatment_ids || [];
      const totalAmount = await this.processTreatments(
        queryRunner,
        savedMedicalRecord,
        treatmentIds,
      );

      // 5. Create Payment
      await this.createPayment(
        queryRunner,
        savedMedicalRecord.id, // ID Medical Record (String UUID)
        existingAppt,
        totalAmount,
        user.id, // ID User pembuat (String UUID)
      );

      // 6. Update Appointment Status
      const updatedAppt = await this.updateAppointmentStatus(
        queryRunner,
        existingAppt,
        dto,
      );

      await queryRunner.commitTransaction();

      this.logger.log(
        `✅ Appointment #${id} completed with medical record and payment`,
      );

      return this.mapper.toResponseDto(updatedAppt);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        'Transaction Error in handleCompletionWithMedicalRecord:',
        error instanceof Error ? error.stack : 'Unknown error',
      );

      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new BadRequestException(
        `Gagal memproses: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Find appointment in transaction
   */
  private async findAppointmentInTransaction(
    queryRunner: QueryRunner,
    id: string, // [UUID] String
  ): Promise<Appointment> {
    const appointment = await queryRunner.manager.findOne(Appointment, {
      where: { id },
      relations: ['patient'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment tidak ditemukan');
    }

    return appointment;
  }

  /**
   * Validate appointment can be completed
   */
  private validateAppointmentForCompletion(appointment: Appointment): void {
    if (appointment.status === AppointmentStatus.SELESAI) {
      throw new ConflictException('Appointment ini sudah berstatus SELESAI.');
    }
  }

  /**
   * Create medical record
   */
  private async createMedicalRecord(
    queryRunner: QueryRunner,
    appointmentId: string, // [UUID] String
    appointment: Appointment,
    dto: UpdateAppointmentDto,
  ): Promise<MedicalRecord> {
    // Gunakan DeepPartial agar sesuai dengan entity
    const medicalRecordData: DeepPartial<MedicalRecord> = {
      appointment_id: appointmentId,
      doctor_id: appointment.doctor_id,
      patient_id: appointment.patient_id,
      subjektif: dto.medical_record?.subjektif,
      objektif: dto.medical_record?.objektif,
      assessment: dto.medical_record?.assessment,
      plan: dto.medical_record?.plan,
    };

    const medicalRecord = queryRunner.manager.create(
      MedicalRecord,
      medicalRecordData,
    );

    return await queryRunner.manager.save(medicalRecord);
  }

  /**
   * Process treatments and calculate total amount
   * [OPTIMIZED]: Menggunakan Single Query + Bulk Insert
   * [MIGRATED]: treatmentIds sekarang string[] (UUID)
   */
  private async processTreatments(
    queryRunner: QueryRunner,
    medicalRecord: MedicalRecord,
    treatmentIds: string[], // [UUID] Ubah ke string[]
  ): Promise<number> {
    if (!treatmentIds || treatmentIds.length === 0) {
      return 0;
    }

    // 1. Fetch semua treatment sekaligus
    // TypeORM 'In' operator otomatis support string UUID
    const treatments = await queryRunner.manager.find(Treatment, {
      where: { id: In(treatmentIds) },
    });

    // 2. Validasi kelengkapan data
    if (treatments.length !== treatmentIds.length) {
      const foundIds = treatments.map((t) => t.id);
      const missingIds = treatmentIds.filter((id) => !foundIds.includes(id));
      throw new BadRequestException(
        `Treatment ID berikut tidak valid: ${missingIds.join(', ')}`,
      );
    }

    let totalAmount = 0;
    const treatmentEntities: MedicalRecordTreatment[] = [];

    // 3. Prepare entities in memory
    for (const treatment of treatments) {
      const hargaFix = Number(treatment.harga) || 0;
      const qty = 1;
      const subtotal = hargaFix * qty;
      const total = subtotal;

      const mrt = queryRunner.manager.create(MedicalRecordTreatment, {
        medicalRecord: medicalRecord,
        treatment: treatment, // Relasi object langsung
        treatmentId: treatment.id, // ID sekarang string (UUID)
        jumlah: qty,
        hargaSatuan: hargaFix,
        subtotal: subtotal,
        total: total,
        keterangan: treatment.namaPerawatan,
      });

      treatmentEntities.push(mrt);
      totalAmount += total;
    }

    // 4. Bulk Save
    if (treatmentEntities.length > 0) {
      await queryRunner.manager.save(MedicalRecordTreatment, treatmentEntities);
    }

    return totalAmount;
  }

  /**
   * Create payment record
   */
  private async createPayment(
    queryRunner: QueryRunner,
    medicalRecordId: string, // [UUID] String
    appointment: Appointment,
    totalAmount: number,
    userId: string, // [UUID] String
  ): Promise<Payment> {
    const paymentData: DeepPartial<Payment> = {
      medicalRecordId: medicalRecordId,
      patientId: appointment.patient_id,
      nomorInvoice: `INV/${Date.now()}`,

      // Menggunakan Date Object agar TypeORM yang handle formatting
      tanggalPembayaran: new Date(),

      totalBiaya: totalAmount,
      totalAkhir: totalAmount,
      jumlahBayar: 0,
      kembalian: 0,

      metodePembayaran: MetodePembayaran.TUNAI,
      statusPembayaran: StatusPembayaran.PENDING,
      keterangan: `Kunjungan tgl ${appointment.tanggal_janji}`,
      createdBy: userId, // Pastikan tipe kolom di entity Payment compatible dengan string UUID
    };

    const payment = queryRunner.manager.create(Payment, paymentData);
    return await queryRunner.manager.save(payment);
  }

  /**
   * Update appointment status to completed
   */
  private async updateAppointmentStatus(
    queryRunner: QueryRunner,
    appointment: Appointment,
    dto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    appointment.status = AppointmentStatus.SELESAI;
    if (dto.jam_janji) {
      appointment.jam_janji = dto.jam_janji;
    }

    return await queryRunner.manager.save(appointment);
  }
}
