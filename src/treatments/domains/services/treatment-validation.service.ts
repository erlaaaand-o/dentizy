// backend/src/treatments/domains/services/treatment-validation.service.ts
import { Injectable } from '@nestjs/common';
import { TreatmentCode } from '../value-objects/treatment-code.vo';
import { TreatmentPrice } from '../value-objects/treatment-price.vo';

@Injectable()
export class TreatmentValidationService {
  validateTreatmentCode(code: string): TreatmentCode {
    return new TreatmentCode(code);
  }

  validateTreatmentPrice(price: number): TreatmentPrice {
    return new TreatmentPrice(price);
  }

  validateTreatmentData(data: {
    kodePerawatan: string;
    namaPerawatan: string;
    harga: number;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      this.validateTreatmentCode(data.kodePerawatan);
    } catch (error) {
      errors.push(error.message);
    }

    try {
      this.validateTreatmentPrice(data.harga);
    } catch (error) {
      errors.push(error.message);
    }

    if (!data.namaPerawatan || data.namaPerawatan.trim().length === 0) {
      errors.push('Treatment name cannot be empty');
    }

    if (data.namaPerawatan && data.namaPerawatan.length > 250) {
      errors.push('Treatment name cannot exceed 250 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
