// backend/src/medical-record-treatments/domains/services/medical-record-treatment-calculator.service.ts
import { Injectable } from '@nestjs/common';

export interface TreatmentCalculation {
  jumlah: number;
  hargaSatuan: number;
  diskon: number;
  subtotal: number;
  total: number;
}

@Injectable()
export class MedicalRecordTreatmentCalculatorService {
  calculateTreatmentCost(
    jumlah: number,
    hargaSatuan: number,
    diskon: number = 0,
  ): TreatmentCalculation {
    const subtotal = this.calculateSubtotal(jumlah, hargaSatuan);
    const total = this.calculateTotal(subtotal, diskon);

    return {
      jumlah,
      hargaSatuan,
      diskon,
      subtotal,
      total,
    };
  }

  private calculateSubtotal(jumlah: number, hargaSatuan: number): number {
    if (jumlah < 0 || hargaSatuan < 0) {
      throw new Error('Jumlah dan harga satuan tidak boleh negatif');
    }
    return jumlah * hargaSatuan;
  }

  private calculateTotal(subtotal: number, diskon: number): number {
    if (diskon < 0) {
      throw new Error('Diskon tidak boleh negatif');
    }
    if (diskon > subtotal) {
      throw new Error('Diskon tidak boleh lebih besar dari subtotal');
    }
    return subtotal - diskon;
  }

  calculateBulkTotal(treatments: TreatmentCalculation[]): number {
    return treatments.reduce((acc, treatment) => acc + treatment.total, 0);
  }
}
