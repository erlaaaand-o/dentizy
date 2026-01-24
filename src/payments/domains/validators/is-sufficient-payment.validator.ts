// backend/src/payments/applications/validators/is-sufficient-payment.validator.ts
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

export interface PaymentPayload {
  totalBiaya: number;
  diskonTotal?: number;
}

@ValidatorConstraint({ name: 'isSufficientPayment', async: false })
export class IsSufficientPaymentConstraint implements ValidatorConstraintInterface {
  validate(jumlahBayar: number, args: ValidationArguments) {
    const object = args.object as PaymentPayload;
    const totalBiaya = object.totalBiaya;

    if (typeof jumlahBayar !== 'number' || typeof totalBiaya !== 'number') {
      return true; // Let other validators handle type checking
    }

    // Allow partial payments, just check if non-negative
    return jumlahBayar >= 0;
  }

  defaultMessage(args: ValidationArguments): string {
    return 'Jumlah bayar tidak valid';
  }
}

export function IsSufficientPayment(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSufficientPaymentConstraint,
    });
  };
}
