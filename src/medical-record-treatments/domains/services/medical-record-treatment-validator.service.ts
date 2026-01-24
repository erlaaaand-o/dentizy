// backend/src/medical-record-treatments/domains/services/medical-record-treatment-validator.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class MedicalRecordTreatmentValidatorService {
  validateQuantity(jumlah: number): void {
    if (jumlah < 1) {
      throw new BadRequestException('Jumlah perawatan minimal 1');
    }
    if (!Number.isInteger(jumlah)) {
      throw new BadRequestException('Jumlah harus berupa bilangan bulat');
    }
  }

  validatePrice(hargaSatuan: number): void {
    if (hargaSatuan < 0) {
      throw new BadRequestException('Harga satuan tidak boleh negatif');
    }
  }

  validateDiscount(diskon: number, subtotal: number): void {
    if (diskon < 0) {
      throw new BadRequestException('Diskon tidak boleh negatif');
    }
    if (diskon > subtotal) {
      throw new BadRequestException('Diskon tidak boleh melebihi subtotal');
    }
  }

  validateTreatmentData(
    jumlah: number,
    hargaSatuan: number,
    diskon: number = 0,
  ): void {
    this.validateQuantity(jumlah);
    this.validatePrice(hargaSatuan);
    const subtotal = jumlah * hargaSatuan;
    this.validateDiscount(diskon, subtotal);
  }
}
