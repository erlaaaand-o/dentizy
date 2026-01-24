import { Injectable } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import {
  Appointment,
  AppointmentStatus,
} from '../../../domains/entities/appointment.entity';
import { User } from '../../../../users/domains/entities/user.entity';
import { FindAppointmentsQueryDto } from '../../../applications/dto/find-appointments-query.dto';
import { AppointmentValidator } from '../../../domains/validators/appointment.validator';

/**
 * Query builder untuk complex queries appointment
 */
@Injectable()
export class AppointmentQueryBuilder {
  constructor(private readonly appointmentValidator: AppointmentValidator) {}

  /**
   * Build query untuk findAll dengan filters
   */
  buildFindAllQuery(
    baseQuery: SelectQueryBuilder<Appointment>,
    user: User,
    queryDto: FindAppointmentsQueryDto,
  ): SelectQueryBuilder<Appointment> {
    const { doctor_id, date, status, page = 1, limit = 10 } = queryDto;
    const skip = (page - 1) * limit;

    // Join relations
    baseQuery
      .leftJoinAndSelect('appointment.patient', 'patient')
      .leftJoinAndSelect('appointment.doctor', 'doctor')
      .leftJoinAndSelect('doctor.roles', 'doctorRoles');

    // Filter by date
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      baseQuery.andWhere(
        'appointment.tanggal_janji BETWEEN :startDate AND :endDate',
        { startDate, endDate },
      );
    }

    // Authorization: Dokter hanya bisa lihat appointmentnya sendiri
    if (this.appointmentValidator.isDoctorOnly(user)) {
      baseQuery.andWhere('appointment.doctor_id = :userId', {
        userId: user.id,
      });
    } else if (doctor_id) {
      // Kepala Klinik atau Staf bisa filter by doctor
      baseQuery.andWhere('appointment.doctor_id = :doctor_id', { doctor_id });
    }

    // Filter by status
    if (status) {
      baseQuery.andWhere('appointment.status = :status', { status });
    }

    // Order & Pagination
    baseQuery
      .orderBy('appointment.tanggal_janji', 'DESC')
      .addOrderBy('appointment.jam_janji', 'ASC')
      .take(limit)
      .skip(skip);

    return baseQuery;
  }

  /**
   * Build query untuk statistics (optional, untuk future use)
   */
  buildStatisticsQuery(
    baseQuery: SelectQueryBuilder<Appointment>,
    doctorId?: number,
    startDate?: Date,
    endDate?: Date,
  ): SelectQueryBuilder<Appointment> {
    if (doctorId) {
      baseQuery.andWhere('appointment.doctor_id = :doctorId', { doctorId });
    }

    if (startDate && endDate) {
      baseQuery.andWhere(
        'appointment.tanggal_janji BETWEEN :startDate AND :endDate',
        { startDate, endDate },
      );
    }

    return baseQuery;
  }

  /**
   * Build query untuk upcoming appointments
   */
  buildUpcomingQuery(
    baseQuery: SelectQueryBuilder<Appointment>,
    userId: number,
    limit: number = 5,
  ): SelectQueryBuilder<Appointment> {
    const now = new Date();

    return baseQuery
      .leftJoinAndSelect('appointment.patient', 'patient')
      .leftJoinAndSelect('appointment.doctor', 'doctor')
      .where('appointment.doctor_id = :userId', { userId })
      .andWhere('appointment.status = :status', {
        status: AppointmentStatus.DIJADWALKAN,
      })
      .andWhere('appointment.tanggal_janji >= :now', { now })
      .orderBy('appointment.tanggal_janji', 'ASC')
      .addOrderBy('appointment.jam_janji', 'ASC')
      .take(limit);
  }
}
