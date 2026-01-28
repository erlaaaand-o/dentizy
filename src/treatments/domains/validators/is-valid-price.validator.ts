// backend/src/treatments/applications/validators/is-valid-price.validator.ts
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

@ValidatorConstraint({ name: 'IsValidPrice' })
export class IsValidPriceConstraint implements ValidatorConstraintInterface {
  validate(price: number, _args: ValidationArguments): boolean {
    if (typeof price !== 'number') return false;
    if (price < 0) return false;
    if (price > 999999999999.99) return false;
    const decimalPlaces = (price.toString().split('.')[1] || '').length;
    return decimalPlaces <= 2;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a positive number ≤ 999999999999.99 with max 2 decimal places`;
  }
}

export function IsValidPrice(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidPriceConstraint,
    });
  };
}
