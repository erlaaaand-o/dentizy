// infrastructure/persistence/repositories/medical-records.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between } from 'typeorm';
import { MedicalRecord } from '../../../domains/entities/medical-record.entity';

export interface DoctorPerformance {
  doctorName: string;
  totalPatients: string;
}

interface MedicalRecordStatistics {
  total: number;
  complete: number;
  incomplete: number;
  byDoctor: Record<number, number>;
}

/**
 * Custom Repository for Medical Records
 * Provides specialized query methods
 */
@Injectable()
export class MedicalRecordsRepository {
  constructor(
    @InjectRepository(MedicalRecord)
    private readonly repository: Repository<MedicalRecord>,
  ) {}

  /**
   * Find by appointment ID
   */
  async findByAppointmentId(
    appointmentId: string,
  ): Promise<MedicalRecord | null> {
    return await this.repository.findOne({
      where: { appointment_id: appointmentId },
      relations: ['appointment', 'doctor', 'patient'],
    });
  }

  /**
   * Find all by patient ID
   */
  async findByPatientId(patientId: string): Promise<MedicalRecord[]> {
    return await this.repository.find({
      where: { patient_id: patientId },
      relations: ['appointment', 'doctor'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Find all by doctor ID
   */
  async findByDoctorId(doctorId: string): Promise<MedicalRecord[]> {
    return await this.repository.find({
      where: { doctor_id: doctorId },
      relations: ['appointment', 'patient'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Find records within date range
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<MedicalRecord[]> {
    return await this.repository.find({
      where: {
        created_at: Between(startDate, endDate),
      },
      relations: ['appointment', 'patient', 'doctor'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Count records by patient
   */
  async countByPatientId(patientId: string): Promise<number> {
    return await this.repository.count({
      where: { patient_id: patientId },
    });
  }

  /**
   * Count records by doctor
   */
  async countByDoctorId(doctorId: string): Promise<number> {
    return await this.repository.count({
      where: { doctor_id: doctorId },
    });
  }

  /**
   * Find incomplete records (missing SOAP fields)
   */
  async findIncomplete(): Promise<MedicalRecord[]> {
    return await this.repository
      .createQueryBuilder('record')
      .where(
        '(record.subjektif IS NULL OR record.subjektif = "") OR ' +
          '(record.objektif IS NULL OR record.objektif = "") OR ' +
          '(record.assessment IS NULL OR record.assessment = "") OR ' +
          '(record.plan IS NULL OR record.plan = "")',
      )
      .leftJoinAndSelect('record.appointment', 'appointment')
      .leftJoinAndSelect('record.patient', 'patient')
      .orderBy('record.created_at', 'DESC')
      .getMany();
  }

  /**
   * Search in SOAP fields
   */
  async searchInSOAP(searchTerm: string): Promise<MedicalRecord[]> {
    return await this.repository
      .createQueryBuilder('record')
      .where(
        'record.subjektif LIKE :search OR ' +
          'record.objektif LIKE :search OR ' +
          'record.assessment LIKE :search OR ' +
          'record.plan LIKE :search',
        { search: `%${searchTerm}%` },
      )
      .leftJoinAndSelect('record.appointment', 'appointment')
      .leftJoinAndSelect('record.patient', 'patient')
      .leftJoinAndSelect('record.doctor', 'doctor')
      .orderBy('record.created_at', 'DESC')
      .getMany();
  }

  /**
   * Get recent records (last N days)
   */
  async getRecentRecords(
    days: number = 7,
    limit: number = 10,
  ): Promise<MedicalRecord[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await this.repository.find({
      where: {
        created_at: Between(startDate, new Date()),
      },
      relations: ['appointment', 'patient', 'doctor'],
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  /**
   * Bulk insert (for migration or seeding)
   */
  async bulkInsert(
    records: Partial<MedicalRecord>[],
  ): Promise<MedicalRecord[]> {
    const entities = this.repository.create(records);
    return await this.repository.save(entities);
  }

  /**
   * Find with custom where clause
   */
  async findWithConditions(
    where: FindOptionsWhere<MedicalRecord> | FindOptionsWhere<MedicalRecord>[],
  ): Promise<MedicalRecord[]> {
    return await this.repository.find({
      where,
      relations: ['appointment', 'patient', 'doctor'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Get statistics by date range
   */
  async getStatistics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<MedicalRecordStatistics> {
    const whereClause: FindOptionsWhere<MedicalRecord> = {};

    if (startDate && endDate) {
      whereClause.created_at = Between(startDate, endDate);
    }

    const records = await this.repository.find({ where: whereClause });

    const complete = records.filter(
      (r) => r.subjektif && r.objektif && r.assessment && r.plan,
    ).length;

    const byDoctor: Record<number, number> = {};
    records.forEach((record) => {
      byDoctor[record.doctor_id] = (byDoctor[record.doctor_id] || 0) + 1;
    });

    return {
      total: records.length,
      complete,
      incomplete: records.length - complete,
      byDoctor,
    };
  }

  /**
   * Get doctor performance statistics (Top Doctors by Patient Count)
   */
  async getDoctorPerformance(
    startDate?: Date,
    endDate?: Date,
  ): Promise<DoctorPerformance[]> {
    const query = this.repository
      .createQueryBuilder('record')
      .leftJoin('record.doctor', 'doctor')
      .select([
        'doctor.nama_lengkap AS doctorName',
        'COUNT(record.id) AS totalPatients',
      ])
      .groupBy('doctor.id')
      .orderBy('totalPatients', 'DESC');

    if (startDate && endDate) {
      query.andWhere('record.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    return await query.getRawMany<DoctorPerformance>();
  }
}
