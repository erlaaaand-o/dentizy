import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';

// Import Entity Relasi
import { Patient } from '../../../patients/domains/entities/patient.entity';
import { MedicalRecord } from '../../../medical_records/domains/entities/medical-record.entity';
import { User } from '../../../users/domains/entities/user.entity';

// Helper untuk mengubah string decimal dari DB menjadi number di JS
class ColumnNumericTransformer {
  to(data: number): number {
    return data;
  }
  from(data: string): number {
    return parseFloat(data);
  }
}

export enum MetodePembayaran {
  TUNAI = 'tunai',
  TRANSFER = 'transfer',
  KARTU_KREDIT = 'kartu_kredit',
  KARTU_DEBIT = 'kartu_debit',
  QRIS = 'qris',
}

export enum StatusPembayaran {
  PENDING = 'pending',
  LUNAS = 'lunas',
  SEBAGIAN = 'sebagian',
  DIBATALKAN = 'dibatalkan',
}

@Entity('payments')
@Index(['medicalRecordId', 'deletedAt'])
@Index(['patientId', 'statusPembayaran'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // --- KOLOM ID (Foreign Keys) ---
  @Column({ type: 'int', name: 'medical_record_id' })
  @Index('idx_payment_medical_record')
  medicalRecordId: string;

  @Column({ type: 'int', name: 'patient_id' })
  @Index('idx_payment_patient')
  patientId: string;

  // --- DATA UTAMA ---
  @Column({ type: 'varchar', length: 50, unique: true, name: 'nomor_invoice' })
  @Index('idx_payment_nomor_invoice')
  nomorInvoice: string;

  @Column({ type: 'datetime', name: 'tanggal_pembayaran' })
  @Index('idx_payment_tanggal')
  tanggalPembayaran: Date;

  // --- DATA KEUANGAN (Dengan Transformer) ---
  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'total_biaya',
    transformer: new ColumnNumericTransformer(),
  })
  totalBiaya: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'total_akhir',
    transformer: new ColumnNumericTransformer(),
  })
  totalAkhir: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'jumlah_bayar',
    transformer: new ColumnNumericTransformer(),
  })
  jumlahBayar: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  kembalian: number;

  // --- ENUMS ---
  @Column({
    type: 'enum',
    enum: MetodePembayaran,
    name: 'metode_pembayaran',
  })
  @Index('idx_payment_metode')
  metodePembayaran: MetodePembayaran;

  @Column({
    type: 'enum',
    enum: StatusPembayaran,
    default: StatusPembayaran.PENDING,
    name: 'status_pembayaran',
  })
  @Index('idx_payment_status')
  statusPembayaran: StatusPembayaran;

  @Column({ type: 'text', nullable: true })
  keterangan: string | null;

  // --- AUDIT TRAIL ---
  @Column({ type: 'int', nullable: true, name: 'created_by' })
  @Index('idx_payment_created_by')
  createdBy: string | null;

  @Column({ type: 'int', nullable: true, name: 'updated_by' })
  updatedBy: string | null;

  @CreateDateColumn({ type: 'datetime', precision: 6, name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', precision: 6, name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({
    type: 'datetime',
    precision: 6,
    name: 'deleted_at',
    nullable: true,
  })
  deletedAt: Date | null;

  // --- RELATIONS ---

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @ManyToOne(() => MedicalRecord)
  @JoinColumn({ name: 'medical_record_id' })
  medicalRecord: MedicalRecord;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updated_by' })
  updater: User;

  // --- DOMAIN LOGIC & HOOKS ---

  @BeforeInsert()
  @BeforeUpdate()
  recalculate(): void {
    // Pastikan nilai numerik
    const total = Number(this.totalBiaya) || 0;
    const bayar = Number(this.jumlahBayar) || 0;

    // 1. Hitung Total Akhir
    this.totalAkhir = total;

    // 2. Hitung Kembalian
    this.kembalian = Math.max(0, bayar - this.totalAkhir);

    // 3. Update Status Otomatis (Jika belum dibatalkan)
    if (this.statusPembayaran !== StatusPembayaran.DIBATALKAN) {
      if (bayar >= this.totalAkhir && this.totalAkhir > 0) {
        this.statusPembayaran = StatusPembayaran.LUNAS;
      } else if (bayar > 0) {
        this.statusPembayaran = StatusPembayaran.SEBAGIAN;
      } else {
        this.statusPembayaran = StatusPembayaran.PENDING;
      }
    }
  }

  isEditable(): boolean {
    return this.statusPembayaran !== StatusPembayaran.DIBATALKAN;
  }

  isCancellable(): boolean {
    return this.statusPembayaran !== StatusPembayaran.DIBATALKAN;
  }
}
