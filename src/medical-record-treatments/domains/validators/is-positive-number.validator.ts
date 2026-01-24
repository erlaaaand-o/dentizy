// backend/src/medical-record-treatments/applications/validators/is-positive-number.validator.ts
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isPositiveNumber', async: false })
export class IsPositiveNumberConstraint implements ValidatorConstraintInterface {
  validate(value: number, args: ValidationArguments): boolean {
    return typeof value === 'number' && value >= 0;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} harus berupa angka positif`;
  }
}

export function IsPositiveNumber(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPositiveNumberConstraint,
    });
  };
}
