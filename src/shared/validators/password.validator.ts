/**
 * Password requirements:
 * - Minimum 8 characters
 * - At least one lowercase letter (a-z)
 * - At least one uppercase letter (A-Z)
 * - At least one digit (0-9)
 * - At least one special character (@$!%*?&#)
 */
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

export const PASSWORD_VALIDATION_MESSAGE =
  'Password harus minimal 8 karakter dengan kombinasi huruf besar, huruf kecil, angka, dan karakter khusus (@$!%*?&#)';

export const PASSWORD_MIN_LENGTH = 8;

/**
 * Helper function to validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password minimal ${PASSWORD_MIN_LENGTH} karakter`);
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password harus mengandung minimal satu huruf kecil');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password harus mengandung minimal satu huruf besar');
  }

  if (!/\d/.test(password)) {
    errors.push('Password harus mengandung minimal satu angka');
  }

  if (!/[@$!%*?&#]/.test(password)) {
    errors.push(
      'Password harus mengandung minimal satu karakter khusus (@$!%*?&#)',
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Custom validator decorator for password
 */
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return false;
          }
          const { isValid } = validatePasswordStrength(value);
          return isValid;
        },
        defaultMessage(args: ValidationArguments) {
          return PASSWORD_VALIDATION_MESSAGE;
        },
      },
    });
  };
}
