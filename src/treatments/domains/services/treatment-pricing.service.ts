// backend/src/treatments/domains/services/treatment-pricing.service.ts
import { Injectable } from '@nestjs/common';
import { Treatment } from '../entities/treatments.entity';

export interface PricingRule {
  name: string;
  calculate: (basePrice: number) => number;
}

@Injectable()
export class TreatmentPricingService {
  private pricingRules: Map<string, PricingRule> = new Map();

  registerPricingRule(rule: PricingRule): void {
    this.pricingRules.set(rule.name, rule);
  }

  calculateFinalPrice(treatment: Treatment, ruleNames: string[] = []): number {
    let finalPrice = treatment.harga;

    for (const ruleName of ruleNames) {
      const rule = this.pricingRules.get(ruleName);
      if (rule) {
        finalPrice = rule.calculate(finalPrice);
      }
    }

    return Math.max(0, finalPrice);
  }

  bulkPriceUpdate(
    treatments: Treatment[],
    adjustmentPercentage: number,
  ): Map<string, number> {
    // [FIX] Ubah Key dari number ke string

    // [FIX] Inisialisasi Map dengan Key string
    const priceMap = new Map<string, number>();

    for (const treatment of treatments) {
      // Best Practice: Pastikan harga dikonversi ke Number dulu untuk keamanan perhitungan
      const currentPrice = Number(treatment.harga);

      const newPrice = currentPrice * (1 + adjustmentPercentage / 100);

      // treatment.id (string/UUID) sekarang cocok dengan Map<string, number>
      priceMap.set(treatment.id, Math.round(newPrice * 100) / 100);
    }

    return priceMap;
  }

  comparePrices(
    treatment1: Treatment,
    treatment2: Treatment,
  ): {
    cheaper: Treatment;
    expensive: Treatment;
    difference: number;
  } {
    if (treatment1.harga < treatment2.harga) {
      return {
        cheaper: treatment1,
        expensive: treatment2,
        difference: treatment2.harga - treatment1.harga,
      };
    }
    return {
      cheaper: treatment2,
      expensive: treatment1,
      difference: treatment1.harga - treatment2.harga,
    };
  }
}
