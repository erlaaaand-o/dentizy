// backend/src/treatments/domains/services/treatment-business.service.ts
import { Injectable } from '@nestjs/common';
import { Treatment } from '../entities/treatments.entity';
import { TreatmentPrice } from '../value-objects/treatment-price.vo';

@Injectable()
export class TreatmentBusinessService {
  canBeDeleted(treatment: Treatment): { allowed: boolean; reason?: string } {
    if (
      treatment.medicalRecordTreatments &&
      treatment.medicalRecordTreatments.length > 0
    ) {
      return {
        allowed: false,
        reason:
          'Treatment has associated medical records and cannot be deleted',
      };
    }

    return { allowed: true };
  }

  canBeUpdated(treatment: Treatment): { allowed: boolean; reason?: string } {
    if (!treatment.isActive && treatment.medicalRecordTreatments?.length > 0) {
      return {
        allowed: false,
        reason:
          'Cannot modify inactive treatment with existing medical records',
      };
    }

    return { allowed: true };
  }

  calculateDiscountedPrice(
    treatment: Treatment,
    discountPercentage: number,
  ): number {
    const price = new TreatmentPrice(treatment.harga);
    return price.applyDiscount(discountPercentage).getValue();
  }

  isExpensive(treatment: Treatment, threshold: number = 1000000): boolean {
    return treatment.harga >= threshold;
  }

  estimateEndTime(treatment: Treatment, startTime: Date): Date {
    if (!treatment.durasiEstimasi) {
      return startTime;
    }
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + treatment.durasiEstimasi);
    return endTime;
  }
}
