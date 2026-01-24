import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { Appointment } from '../../../domains/entities/appointment.entity';
import { Patient } from '../../../../patients/domains/entities/patient.entity';
import { User } from '../../../../users/domains/entities/user.entity';

/**
 * Repository wrapper untuk Appointment
 * Abstraksi data access layer
 */
@Injectable()
export class AppointmentsRepository {
  private readonly logger = new Logger(AppointmentsRepository.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create query runner untuk transaction
   */
  createQueryRunner(): QueryRunner {
    return this.dataSource.createQueryRunner();
  }

  /**
   * Find appointment by ID dengan relations
   */
  async findById(id: string): Promise<Appointment | null> {
    return await this.appointmentRepository.findOne({
      where: { id },
      relations: ['patient', 'doctor', 'doctor.roles', 'medical_record'],
    });
  }

  /**
   * Find appointment by ID dalam transaction
   */
  async findByIdInTransaction(
    queryRunner: QueryRunner,
    id: string,
  ): Promise<Appointment | null> {
    return await queryRunner.manager.findOne(Appointment, {
      where: { id },
      relations: ['patient', 'doctor', 'doctor.roles', 'medical_record'],
    });
  }

  /**
   * Find patient by ID
   */
  async findPatientById(patientId: string): Promise<Patient | null> {
    return await this.patientRepository.findOne({
      where: { id: patientId },
    });
  }

  /**
   * Find patient by ID dalam transaction
   */
  async findPatientByIdInTransaction(
    queryRunner: QueryRunner,
    patientId: string,
  ): Promise<Patient | null> {
    return await queryRunner.manager.findOne(Patient, {
      where: { id: patientId },
    });
  }

  /**
   * Find doctor by ID dengan roles
   */
  async findDoctorById(doctorId: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id: doctorId },
      relations: ['roles'],
    });
  }

  /**
   * Find doctor by ID dalam transaction
   */
  async findDoctorByIdInTransaction(
    queryRunner: QueryRunner,
    doctorId: string,
  ): Promise<User | null> {
    return await queryRunner.manager.findOne(User, {
      where: { id: doctorId },
      relations: ['roles'],
    });
  }

  /**
   * Save appointment
   */
  async save(appointment: Appointment): Promise<Appointment> {
    return await this.appointmentRepository.save(appointment);
  }

  /**
   * Save appointment dalam transaction
   */
  async saveInTransaction(
    queryRunner: QueryRunner,
    appointment: Partial<Appointment>,
  ): Promise<Appointment> {
    const entity = queryRunner.manager.create(Appointment, appointment);
    return await queryRunner.manager.save(entity);
  }

  /**
   * Update appointment dalam transaction
   */
  async updateInTransaction(
    queryRunner: QueryRunner,
    appointment: Appointment,
  ): Promise<Appointment> {
    return await queryRunner.manager.save(appointment);
  }

  /**
   * Remove appointment
   */
  async remove(appointment: Appointment): Promise<void> {
    await this.appointmentRepository.remove(appointment);
  }

  /**
   * Get base query builder
   */
  createQueryBuilder(alias: string = 'appointment') {
    return this.appointmentRepository.createQueryBuilder(alias);
  }
}
