// backend/src/treatments/domains/entities/treatments.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { TreatmentCategory } from '../../../treatment-categories/domains/entities/treatment-categories.entity';
import { MedicalRecordTreatment } from '../../../medical-record-treatments/domains/entities/medical-record-treatments.entity';

@Entity('treatments')
@Index(['kodePerawatan', 'deletedAt'])
@Index(['categoryId', 'isActive', 'deletedAt'])
export class Treatment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', name: 'category_id' })
  @Index('idx_treatment_category')
  categoryId: string;

  @Column({ type: 'varchar', length: 50, unique: true, name: 'kode_perawatan' })
  @Index('idx_treatment_kode')
  kodePerawatan: string;

  @Column({ type: 'varchar', length: 250, name: 'nama_perawatan' })
  @Index('idx_treatment_nama')
  namaPerawatan: string;

  @Column({ type: 'text', nullable: true })
  deskripsi: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  harga: number;

  @Column({
    type: 'int',
    nullable: true,
    name: 'durasi_estimasi',
    comment: 'dalam menit',
  })
  durasiEstimasi: number;

  @Column({ type: 'tinyint', default: 1, name: 'is_active' })
  @Index('idx_treatment_active')
  isActive: boolean;

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
  deletedAt: Date;

  @ManyToOne(() => TreatmentCategory, (category) => category.treatments, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'category_id' })
  category: TreatmentCategory;

  @OneToMany(() => MedicalRecordTreatment, (mrt) => mrt.treatment)
  medicalRecordTreatments: MedicalRecordTreatment[];

  // Domain methods
  activate(): void {
    this.isActive = true;
  }

  deactivate(): void {
    this.isActive = false;
  }

  updatePrice(newPrice: number): void {
    if (newPrice < 0) {
      throw new Error('Price cannot be negative');
    }
    this.harga = newPrice;
  }

  isAvailable(): boolean {
    return this.isActive && !this.deletedAt;
  }
}
