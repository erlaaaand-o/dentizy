// backend/src/treatment-categories/domain/entities/treatment-category.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Treatment } from '../../../treatments/domains/entities/treatments.entity';

@Entity('treatment_categories')
export class TreatmentCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, name: 'nama_kategori' })
  @Index('idx_treatment_category_nama')
  namaKategori: string;

  @Column({ type: 'text', nullable: true })
  deskripsi: string;

  @Column({ type: 'tinyint', default: 1, name: 'is_active' })
  @Index('idx_treatment_category_active')
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

  @OneToMany(() => Treatment, (treatment) => treatment.category)
  treatments: Treatment[];
}
