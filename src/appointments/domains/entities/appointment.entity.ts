import { MedicalRecord } from '../../../medical_records/domains/entities/medical-record.entity';
import { Patient } from '../../../patients/domains/entities/patient.entity';
import { User } from '../../../users/domains/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  Index,
} from 'typeorm';

export enum AppointmentStatus {
  DIJADWALKAN = 'dijadwalkan',
  SELESAI = 'selesai',
  DIBATALKAN = 'dibatalkan',
  MENUNGGU_KONFIRMASI = 'menunggu_konfirmasi',
}

@Entity('appointments')
// ✅ Composite indexes untuk query yang sering digunakan
@Index('idx_appointment_doctor_date', ['doctor_id', 'tanggal_janji', 'status'])
@Index('idx_appointment_patient_date', ['patient_id', 'tanggal_janji'])
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index('idx_appointment_patient') // Index untuk filter by patient
  patient_id: string;

  @Column()
  @Index('idx_appointment_doctor') // Index untuk filter by doctor
  doctor_id: string;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.DIJADWALKAN,
  })
  @Index('idx_appointment_status') // Index untuk filter by status
  status: AppointmentStatus;

  @Column()
  @Index('idx_appointment_tanggal') // Index untuk filter & sort by date
  tanggal_janji: Date;

  @Column({ type: 'time' })
  jam_janji: string;

  @Column({ type: 'text', nullable: true })
  keluhan: string;

  @CreateDateColumn()
  @Index('idx_appointment_created_at') // Index untuk sorting
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Patient, (patient) => patient.appointments)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'doctor_id' })
  doctor: User;

  @OneToOne(() => MedicalRecord, (record) => record.appointment)
  medical_record: MedicalRecord;
}
