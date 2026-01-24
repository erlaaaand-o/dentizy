// backend/src/treatments/domains/entities/treatment.interface.ts
import { TreatmentCategory } from '../../../treatment-categories/domains/entities/treatment-categories.entity';
import { MedicalRecordTreatment } from '../../../medical-record-treatments/domains/entities/medical-record-treatments.entity';

export interface ITreatment {
  id: number;
  categoryId: number;
  kodePerawatan: string;
  namaPerawatan: string;
  deskripsi: string | null;
  harga: number;
  durasiEstimasi: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  category?: TreatmentCategory;
  medicalRecordTreatments?: MedicalRecordTreatment[];
}

export interface ITreatmentWithCategory extends ITreatment {
  category: TreatmentCategory;
}

export interface ITreatmentCreate {
  categoryId: number;
  kodePerawatan: string;
  namaPerawatan: string;
  deskripsi?: string;
  harga: number;
  durasiEstimasi?: number;
  isActive?: boolean;
}

export interface ITreatmentUpdate {
  categoryId?: number;
  namaPerawatan?: string;
  deskripsi?: string;
  harga?: number;
  durasiEstimasi?: number;
  isActive?: boolean;
}
