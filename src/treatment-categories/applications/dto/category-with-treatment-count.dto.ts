// backend/src/treatment-categories/applications/dto/category-with-treatment-count.dto.ts
export class CategoryWithTreatmentCountDto {
  id: string;
  namaKategori: string;
  deskripsi: string | null;
  isActive: boolean;
  treatmentCount: number;
}
