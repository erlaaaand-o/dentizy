// backend/src/treatment-categories/domains/validators/treatment-category.validator.ts
import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { TreatmentCategoryRepository } from '../../infrastructures/persistence/repositories/treatment-category.repository';
import { CreateTreatmentCategoryDto } from '../../applications/dto/create-treatment-category.dto';
import { UpdateTreatmentCategoryDto } from '../../applications/dto/update-treatment-category.dto';
import { TreatmentCategoryDomainService } from '../../domains/services/treatment-category.domain-service';

@Injectable()
export class TreatmentCategoryValidator {
  constructor(
    private readonly repository: TreatmentCategoryRepository,
    private readonly domainService: TreatmentCategoryDomainService,
  ) {}

  async validateCreate(dto: CreateTreatmentCategoryDto): Promise<void> {
    // Check duplicate name
    const isDuplicate = await this.domainService.isNameDuplicate(
      dto.namaKategori,
    );
    if (isDuplicate) {
      throw new ConflictException(
        `Kategori dengan nama "${dto.namaKategori}" sudah ada`,
      );
    }

    // Validate name format
    if (!this.domainService.isValidName(dto.namaKategori)) {
      throw new BadRequestException(
        'Nama kategori tidak valid. Hindari karakter khusus yang tidak perlu',
      );
    }
  }

  async validateUpdate(
    id: string,
    dto: UpdateTreatmentCategoryDto,
  ): Promise<void> {
    // Check duplicate name (excluding current category)
    if (dto.namaKategori) {
      const isDuplicate = await this.domainService.isNameDuplicate(
        dto.namaKategori,
        id,
      );
      if (isDuplicate) {
        throw new ConflictException(
          `Kategori dengan nama "${dto.namaKategori}" sudah ada`,
        );
      }

      // Validate name format
      if (!this.domainService.isValidName(dto.namaKategori)) {
        throw new BadRequestException(
          'Nama kategori tidak valid. Hindari karakter khusus yang tidak perlu',
        );
      }
    }
  }

  async validateDelete(id: string): Promise<void> {
    // Check if category has associated treatments
    const hasActiveTreatments =
      await this.domainService.hasActiveTreatments(id);
    if (hasActiveTreatments) {
      throw new BadRequestException(
        'Tidak dapat menghapus kategori yang masih memiliki perawatan aktif. Hapus atau pindahkan perawatan terlebih dahulu.',
      );
    }
  }
}
