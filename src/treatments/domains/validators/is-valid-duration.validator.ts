// backend/src/treatments/applications/validators/is-valid-duration.validator.ts
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

@ValidatorConstraint({ name: 'IsValidDuration' })
export class IsValidDurationConstraint implements ValidatorConstraintInterface {
  validate(duration: number, args: ValidationArguments): boolean {
    if (duration === null || duration === undefined) return true;
    if (typeof duration !== 'number') return false;
    if (duration < 0) return false;
    if (duration > 1440) return false; // Max 24 hours
    return Number.isInteger(duration);
  }

  defaultMessage(args: ValidationArguments): string {
    return 'Duration must be an integer between 0 and 1440 minutes (24 hours)';
  }
}

export function IsValidDuration(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidDurationConstraint,
    });
  };
}
