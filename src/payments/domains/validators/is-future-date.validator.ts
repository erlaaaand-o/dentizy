// backend/src/payments/applications/validators/is-future-date.validator.ts
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isNotFutureDate', async: false })
export class IsNotFutureDateConstraint implements ValidatorConstraintInterface {
  validate(dateValue: string | Date): boolean {
    if (!dateValue) return true;

    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    const now = new Date();

    return date <= now;
  }

  defaultMessage() {
    return 'Tanggal pembayaran tidak boleh di masa depan';
  }
}

export function IsNotFutureDate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsNotFutureDateConstraint,
    });
  };
}
