// backend/src/medical-record-treatments/domain/entities/medical-record-treatment.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Treatment } from '../../../treatments/domains/entities/treatments.entity';
import { MedicalRecord } from '../../../medical_records/domains/entities/medical-record.entity'; // Sesuaikan path

@Entity('medical_record_treatments')
export class MedicalRecordTreatment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', name: 'medical_record_id' })
  @Index('idx_mrt_medical_record')
  medicalRecordId: string;

  @Column({ type: 'int', name: 'treatment_id' })
  @Index('idx_mrt_treatment')
  treatmentId: string;

  @Column({ type: 'int', default: 1 })
  jumlah: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'harga_satuan' })
  hargaSatuan: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  diskon: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  total: number;

  @Column({ type: 'text', nullable: true })
  keterangan: string;

  @CreateDateColumn({ type: 'datetime', precision: 6, name: 'created_at' })
  @Index('idx_mrt_created_at')
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', precision: 6, name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({
    type: 'datetime',
    precision: 6,
    name: 'deleted_at',
    nullable: true,
  })
  deletedAt: Date;

  @ManyToOne(() => MedicalRecord, (mr) => mr.medicalRecordTreatments)
  @JoinColumn({ name: 'medical_record_id' })
  medicalRecord: MedicalRecord; // <--- Properti ini yang dicari Query Builder ("mrt.medicalRecord")

  @ManyToOne(() => Treatment, (treatment) => treatment.medicalRecordTreatments)
  @JoinColumn({ name: 'treatment_id' })
  treatment: Treatment;
}
