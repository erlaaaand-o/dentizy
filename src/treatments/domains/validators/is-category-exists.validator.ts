// backend/src/treatments/applications/validators/is-category-exists.validator.ts
import { Injectable } from '@nestjs/common';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';
import { TreatmentCategoryRepository } from '../../../treatment-categories/infrastructures/persistence/repositories/treatment-category.repository';

@ValidatorConstraint({ name: 'IsCategoryExists', async: true })
@Injectable()
export class IsCategoryExistsConstraint implements ValidatorConstraintInterface {
  constructor(
    private readonly categoryRepository: TreatmentCategoryRepository,
  ) {}

  async validate(categoryId: string): Promise<boolean> {
    if (!categoryId) return true;
    return await this.categoryRepository.exists(categoryId);
  }

  defaultMessage(args: ValidationArguments): string {
    return `Category with ID '${args.value}' does not exist`;
  }
}

export function IsCategoryExists(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCategoryExistsConstraint,
    });
  };
}
