import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { Brackets, QueryRunner } from 'typeorm';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';

/**
 * Validator untuk deteksi konflik jadwal appointment
 */
@Injectable()
export class AppointmentConflictValidator {
  private readonly logger = new Logger(AppointmentConflictValidator.name);
  private readonly BUFFER_MINUTES = 30;

  /**
   * 1. Cek konflik jadwal DOKTER (Untuk Creation)
   * Memastikan Dokter tidak double-book di jam yang sama (Hanya status DIJADWALKAN)
   */
  async validateDoctorNoConflict(
    queryRunner: QueryRunner,
    doctorId: string,
    tanggalJanji: Date,
    jamJanji: string,
    bufferStart: string,
    bufferEnd: string,
  ): Promise<void> {
    const conflictingAppointment = await queryRunner.manager
      .createQueryBuilder(Appointment, 'appointment')
      .where('appointment.doctor_id = :doctorId', { doctorId })
      .andWhere('appointment.tanggal_janji = :tanggalJanji', { tanggalJanji })
      // [PENTING] Hanya cek yang statusnya DIJADWALKAN.
      .andWhere('appointment.status = :status', {
        status: AppointmentStatus.DIJADWALKAN,
      })
      .andWhere(
        new Brackets((qb) => {
          qb.where(
            'appointment.jam_janji BETWEEN :bufferStart AND :bufferEnd',
            {
              bufferStart,
              bufferEnd,
            },
          ).orWhere(
            `TIME_TO_SEC(appointment.jam_janji) - TIME_TO_SEC(:requestedTime) 
                         BETWEEN -1800 AND 1800`,
            { requestedTime: jamJanji },
          );
        }),
      )
      .setLock('pessimistic_write')
      .getOne();

    if (conflictingAppointment) {
      throw new ConflictException(
        `Dokter sudah memiliki jadwal aktif di jam ${conflictingAppointment.jam_janji}.`,
      );
    }
  }

  /**
   * 2. Cek konflik jadwal PASIEN (Untuk Creation)
   * Memastikan Pasien tidak booking 2 dokter di jam yang sama
   */
  async validatePatientNoConflict(
    queryRunner: QueryRunner,
    patientId: string,
    tanggalJanji: Date,
    jamJanji: string,
    bufferStart: string,
    bufferEnd: string,
  ): Promise<void> {
    const conflictingAppointment = await queryRunner.manager
      .createQueryBuilder(Appointment, 'appointment')
      .where('appointment.patient_id = :patientId', { patientId })
      .andWhere('appointment.tanggal_janji = :tanggalJanji', { tanggalJanji })
      // [PENTING] Abaikan appointment masa lalu yang sudah SELESAI
      .andWhere('appointment.status = :status', {
        status: AppointmentStatus.DIJADWALKAN,
      })
      .andWhere(
        new Brackets((qb) => {
          qb.where(
            'appointment.jam_janji BETWEEN :bufferStart AND :bufferEnd',
            {
              bufferStart,
              bufferEnd,
            },
          ).orWhere(
            `TIME_TO_SEC(appointment.jam_janji) - TIME_TO_SEC(:requestedTime) BETWEEN -1800 AND 1800`,
            { requestedTime: jamJanji },
          );
        }),
      )
      .setLock('pessimistic_write')
      .getOne();

    if (conflictingAppointment) {
      throw new ConflictException(
        `Pasien ini masih memiliki jadwal aktif di jam ${conflictingAppointment.jam_janji}. ` +
          `Selesaikan atau batalkan jadwal tersebut sebelum membuat janji baru di jam yang sama.`,
      );
    }
  }

  /**
   * 3. Cek konflik untuk UPDATE Appointment
   * Logika sama dengan Dokter Conflict, tapi mengecualikan ID diri sendiri.
   */
  async validateNoConflictForUpdate(
    queryRunner: QueryRunner,
    appointmentId: string,
    doctorId: string,
    tanggalJanji: Date,
    jamJanji: string,
    bufferStart: string,
    bufferEnd: string,
  ): Promise<void> {
    const conflictingAppointment = await queryRunner.manager
      .createQueryBuilder(Appointment, 'appointment')
      // Exclude diri sendiri agar tidak dianggap bentrok
      .where('appointment.id != :appointmentId', { appointmentId })
      .andWhere('appointment.doctor_id = :doctorId', { doctorId })
      .andWhere('appointment.tanggal_janji = :tanggalJanji', { tanggalJanji })
      // Tetap hanya cek yang DIJADWALKAN
      .andWhere('appointment.status = :status', {
        status: AppointmentStatus.DIJADWALKAN,
      })
      .andWhere(
        new Brackets((qb) => {
          qb.where(
            'appointment.jam_janji BETWEEN :bufferStart AND :bufferEnd',
            {
              bufferStart,
              bufferEnd,
            },
          ).orWhere(
            `TIME_TO_SEC(appointment.jam_janji) - TIME_TO_SEC(:requestedTime) BETWEEN -1800 AND 1800`,
            { requestedTime: jamJanji },
          );
        }),
      )
      .setLock('pessimistic_write')
      .getOne();

    if (conflictingAppointment) {
      throw new ConflictException(
        `Dokter sudah memiliki janji temu di waktu yang berdekatan (${conflictingAppointment.jam_janji}). ` +
          `Silakan pilih waktu minimal ${this.BUFFER_MINUTES} menit sebelum atau sesudah.`,
      );
    }
  }
}
