import { Injectable, ConflictException, Logger } from '@nestjs/common';

import { CreatePatientDto } from '../../../patients/application/dto/create-patient.dto';
import { PatientCreationService } from '../../../patients/application/use-cases/patient-creation.service';
import { PatientRepository } from '../../../patients/infrastructure/persistence/repositories/patients.repository';
import {
  Appointment,
  AppointmentStatus,
} from '../../domains/entities/appointment.entity';
import { TransactionManager } from '../../infrastructures/transactions/transaction.manager';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { PublicBookingDto } from '../dto/public-booking.dto';

import { AppointmentCreationService } from './appointment-creation.service';

@Injectable()
export class PublicBookingService {
  private readonly logger = new Logger(PublicBookingService.name);

  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly patientRepository: PatientRepository,
    private readonly patientCreationService: PatientCreationService,
    private readonly appointmentCreationService: AppointmentCreationService,
  ) {}

  async execute(dto: PublicBookingDto): Promise<Appointment> {
    try {
      // 1. Cek Apakah Pasien Sudah Ada (Read Only)
      const existingPatient = await this.patientRepository.findByNik(dto.nik);

      let patientId: string;

      if (existingPatient) {
        // 2A. VALIDASI KEAMANAN (Mencegah penyalahgunaan NIK)
        // Cocokkan Tanggal Lahir input dengan Database
        const inputBirthDate = new Date(dto.tanggal_lahir)
          .toISOString()
          .split('T')[0];
        const dbBirthDate = new Date(existingPatient.tanggal_lahir!)
          .toISOString()
          .split('T')[0];

        if (inputBirthDate !== dbBirthDate) {
          throw new ConflictException(
            'NIK sudah terdaftar namun data tanggal lahir tidak cocok. Silakan periksa kembali atau hubungi klinik.',
          );
        }

        // Pasien valid
        patientId = existingPatient.id;
      } else {
        // 2B. BUAT PASIEN BARU (Status Sementara: Non-Aktif)
        const newPatientDto: CreatePatientDto = {
          nama_lengkap: dto.nama_lengkap,
          nik: dto.nik,
          no_hp: dto.no_hp,
          tanggal_lahir: dto.tanggal_lahir,
          jenis_kelamin: dto.jenis_kelamin,
          alamat: dto.alamat,
          email: dto.email,
        };

        const newPatient =
          await this.patientCreationService.execute(newPatientDto);

        await this.patientRepository.update(newPatient.id, {
          is_active: false,
          is_registered_online: true,
        });

        patientId = newPatient.id;
        this.logger.log(
          `🆕 New provisional patient created: #${patientId} (waiting verification)`,
        );
      }

      // 3. BUAT APPOINTMENT
      const appointmentDto: CreateAppointmentDto = {
        patient_id: patientId,
        doctor_id: dto.doctor_id,
        tanggal_janji: dto.tanggal_janji,
        jam_janji: dto.jam_janji,
        keluhan: dto.keluhan,
        status: AppointmentStatus.MENUNGGU_KONFIRMASI,
      };

      // Panggil AppointmentCreationService (sudah handle validation & conflict check)
      const appointment =
        await this.appointmentCreationService.execute(appointmentDto);

      return appointment;
    } catch (error) {
      this.logger.error('❌ Public booking failed:', error);
      // Re-throw error agar controller bisa handle response code
      throw error;
    }
  }
}
