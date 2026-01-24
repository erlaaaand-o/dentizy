import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { Appointment } from '../appointments/domains/entities/appointment.entity';
import { MedicalRecord } from '../medical_records/domains/entities/medical-record.entity';
import { Patient, Gender } from '../patients/domains/entities/patient.entity';
import { Role, UserRole } from '../roles/entities/role.entity';
import { User } from '../users/domains/entities/user.entity';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(MedicalRecord)
    private readonly medicalRecordRepo: Repository<MedicalRecord>,
  ) {}

  async seed() {
    this.logger.log('📦 Memulai proses seeding database...');

    try {
      // 1. Seed Roles (jika kosong)
      await this.seedRoles();

      // 2. Seed Users (jika kosong)
      await this.seedUsers();

      // 3. Seed Patients (jika kosong)
      await this.seedPatients();

      // 4. Seed Appointments (jika kosong)
      // await this.seedAppointments();

      this.logger.log('✅ Seeding completed successfully');
    } catch (error) {
      this.logger.error('❌ Seeding failed:', error);
      throw error;
    }
  }

  /**
   * ✅ FIX: Idempotent role seeding
   */
  private async seedRoles() {
    try {
      const existingRoles = await this.roleRepo.find();

      if (existingRoles.length > 0) {
        this.logger.log('⏭️  Roles already exist, skipping...');
        return;
      }

      this.logger.log('📝 Seeding roles...');

      const roles = [
        { name: UserRole.DOKTER, description: 'Akses untuk dokter gigi' },
        { name: UserRole.STAF, description: 'Akses untuk staf administrasi' },
        {
          name: UserRole.KEPALA_KLINIK,
          description: 'Akses penuh untuk kepala klinik',
        },
      ];

      await this.roleRepo.save(roles);
      this.logger.log('✅ Roles seeded successfully');
    } catch (error) {
      this.logger.error('❌ Error seeding roles:', error);
      throw error;
    }
  }

  /**
   * ✅ FIX: Idempotent user seeding dengan error handling
   */
  private async seedUsers() {
    try {
      const existingUsers = await this.userRepo.find();

      if (existingUsers.length > 0) {
        this.logger.log('⏭️  Users already exist, skipping...');
        return;
      }

      this.logger.log('👥 Seeding users...');

      const kepalaKlinikRole = await this.roleRepo.findOneBy({
        name: UserRole.KEPALA_KLINIK,
      });
      const dokterRole = await this.roleRepo.findOneBy({
        name: UserRole.DOKTER,
      });
      const stafRole = await this.roleRepo.findOneBy({ name: UserRole.STAF });

      if (!dokterRole || !stafRole || !kepalaKlinikRole) {
        throw new Error('Roles not found. Please run role seeding first.');
      }

      const hashedPassword = await bcrypt.hash('developerganteng', 10);

      const users = [
        {
          nama_lengkap: 'Dr. Anisa Putri',
          username: 'anisa_putri',
          password: hashedPassword,
          email: 'mockemail1gmail.com',
          roles: [dokterRole],
        },
        {
          nama_lengkap: 'Budi Santoso',
          username: 'budi_staf',
          password: hashedPassword,
          email: 'mockemail2gmail.com',
          roles: [stafRole],
        },
        {
          nama_lengkap: 'Siti Rahma',
          username: 'siti_kepala',
          email: 'mockemail3gmail.com',
          password: hashedPassword,
          roles: [kepalaKlinikRole],
        },
      ];

      await this.userRepo.save(users);
      this.logger.log('✅ Users seeded successfully');
    } catch (error) {
      this.logger.error('❌ Error seeding users:', error);
      throw error;
    }
  }

  /**
   * ✅ FIX: Idempotent patient seeding dengan auto-generate MRN
   */
  private async seedPatients() {
    try {
      const existingPatients = await this.patientRepo.find();

      if (existingPatients.length > 0) {
        this.logger.log('⏭️  Patients already exist, skipping...');
        return;
      }

      this.logger.log('👤 Seeding patients...');

      const today = new Date();
      const datePrefix = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;

      const patients = [
        {
          nama_lengkap: 'Andi Wijaya',
          nik: '3201012345678901',
          nomor_rekam_medis: `${datePrefix}-001`,
          tanggal_lahir: new Date('1990-04-12'),
          jenis_kelamin: Gender.MALE,
          alamat: 'Jl. Melati No. 12, Bandung',
          email: 'andi.wijaya@example.com',
          no_hp: '081234567890',
          is_registered_online: true,
        },
        {
          nama_lengkap: 'Dewi Anggraini',
          nik: '3201012345678902',
          nomor_rekam_medis: `${datePrefix}-002`,
          tanggal_lahir: new Date('1992-09-25'),
          jenis_kelamin: Gender.FEMALE,
          alamat: 'Jl. Kenanga No. 8, Jakarta',
          email: 'dewi.anggraini@example.com',
          no_hp: '081298765432',
          is_registered_online: true,
        },
        {
          nama_lengkap: 'Rizki Pratama',
          nik: '3201012345678903',
          nomor_rekam_medis: `${datePrefix}-003`,
          tanggal_lahir: new Date('1988-12-05'),
          jenis_kelamin: Gender.MALE,
          alamat: 'Jl. Anggrek No. 3, Surabaya',
          email: 'rizki.pratama@example.com',
          no_hp: '081355512345',
          is_registered_online: false,
        },
        {
          nama_lengkap: 'Siti Rahmawati',
          nik: '3201012345678904',
          nomor_rekam_medis: `${datePrefix}-004`,
          tanggal_lahir: new Date('1995-01-15'),
          jenis_kelamin: Gender.FEMALE,
          alamat: 'Jl. Merpati No. 20, Medan',
          email: 'siti.rahmawati@example.com',
          no_hp: '081244478901',
          is_registered_online: true,
        },
        {
          nama_lengkap: 'Budi Santoso',
          nik: '3201012345678905',
          nomor_rekam_medis: `${datePrefix}-005`,
          tanggal_lahir: new Date('1987-07-09'),
          jenis_kelamin: Gender.MALE,
          alamat: 'Jl. Mawar No. 5, Yogyakarta',
          email: 'budi.santoso@example.com',
          no_hp: '081377765432',
          is_registered_online: false,
        },
      ];

      await this.patientRepo.save(patients);
      this.logger.log('✅ Patients seeded successfully');
    } catch (error) {
      this.logger.error('❌ Error seeding patients:', error);
      throw error;
    }
  }
}
