import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Patient } from '../../../patients/domains/entities/patient.entity';

export enum FingerprintQuality {
  POOR = 'poor',
  FAIR = 'fair',
  GOOD = 'good',
  EXCELLENT = 'excellent',
}

export enum FingerPosition {
  LEFT_THUMB = 'left_thumb',
  LEFT_INDEX = 'left_index',
  LEFT_MIDDLE = 'left_middle',
  LEFT_RING = 'left_ring',
  LEFT_LITTLE = 'left_little',
  RIGHT_THUMB = 'right_thumb',
  RIGHT_INDEX = 'right_index',
  RIGHT_MIDDLE = 'right_middle',
  RIGHT_RING = 'right_ring',
  RIGHT_LITTLE = 'right_little',
}

@Entity('fingerprints')
@Index('idx_fingerprint_patient', ['patient_id'])
@Index('idx_fingerprint_active', ['is_active'])
export class Fingerprint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  patient_id: string;

  @ManyToOne(() => Patient, (patient) => patient.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({
    type: 'enum',
    enum: FingerPosition,
  })
  finger_position: FingerPosition;

  @Column({ type: 'text' })
  template_data: string; // Base64 encoded fingerprint template

  @Column({ type: 'varchar', length: 100, nullable: true })
  device_id: string; // ID perangkat yang digunakan untuk enrollment

  @Column({ type: 'varchar', length: 50, nullable: true })
  device_model: string; // Model perangkat (ZKTeco, Morpho, dll)

  @Column({
    type: 'enum',
    enum: FingerprintQuality,
    default: FingerprintQuality.FAIR,
  })
  quality: FingerprintQuality;

  @Column({ type: 'int', default: 0 })
  match_score: number; // Skor kualitas template (0-100)

  @Column({ type: 'int', default: 0 })
  verification_count: number; // Jumlah verifikasi berhasil

  @Column({ type: 'timestamp', nullable: true })
  last_verified_at: Date;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Virtual getter untuk format display
  get display_name(): string {
    return this.finger_position.replace('_', ' ').toUpperCase();
  }
}
