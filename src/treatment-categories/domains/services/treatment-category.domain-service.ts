// backend/src/treatment-categories/domains/services/treatment-category.domain-service.ts
import { Injectable } from '@nestjs/common';
import { TreatmentCategoryRepository } from '../../infrastructures/persistence/repositories/treatment-category.repository';

@Injectable()
export class TreatmentCategoryDomainService {
  constructor(private readonly repository: TreatmentCategoryRepository) {}

  async isNameDuplicate(name: string, excludeId?: string): Promise<boolean> {
    const existing = await this.repository.findByName(name);

    if (!existing) {
      return false;
    }

    // If excludeId is provided, check if the found category is different
    if (excludeId !== undefined) {
      return existing.id !== excludeId;
    }

    return true;
  }

  isValidName(name: string): boolean {
    // Check for minimum length
    if (name.length < 3) {
      return false;
    }

    // Check for excessive special characters
    const specialCharCount = (name.match(/[^a-zA-Z0-9\s-]/g) || []).length;
    if (specialCharCount > 3) {
      return false;
    }

    // Check for consecutive spaces
    if (/\s{2,}/.test(name)) {
      return false;
    }

    return true;
  }

  async hasActiveTreatments(categoryId: string): Promise<boolean> {
    return await this.repository.hasActiveTreatments(categoryId);
  }

  async canBeDeleted(categoryId: string): Promise<boolean> {
    const hasActive = await this.hasActiveTreatments(categoryId);
    return !hasActive;
  }

  async canBeDeactivated(categoryId: string): Promise<boolean> {
    // Business rule: Can deactivate even if has treatments
    // Treatments will remain but new ones cannot be assigned
    return true;
  }
}
