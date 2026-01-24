// backend/src/users/applications/dto/account-activation.dto.ts
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import {
  IsStrongPassword,
  PASSWORD_MIN_LENGTH,
} from '../../../shared/validators/password.validator';

/**
 * DTO untuk request activation email
 */
export class RequestActivationDto {
  @ApiProperty({
    description: 'Username atau email pengguna',
    example: 'johndoe',
  })
  @IsNotEmpty({ message: 'Username atau email harus diisi' })
  @IsString()
  usernameOrEmail: string;
}

/**
 * DTO untuk verify activation token
 */
export class VerifyActivationTokenDto {
  @ApiProperty({
    description: 'Token aktivasi dari email',
    example: 'eyJhbGc...',
  })
  @IsNotEmpty({ message: 'Token aktivasi harus diisi' })
  @IsString()
  token: string;
}

/**
 * DTO untuk activate account dengan password
 */
export class ActivateAccountDto {
  @ApiProperty({
    description: 'Token aktivasi dari email',
    example: 'eyJhbGc...',
  })
  @IsNotEmpty({ message: 'Token aktivasi harus diisi' })
  @IsString()
  token: string;

  @ApiProperty({
    description: `Password baru, minimal ${PASSWORD_MIN_LENGTH} karakter`,
    example: 'SecurePassword123!',
    minLength: PASSWORD_MIN_LENGTH,
  })
  @IsNotEmpty({ message: 'Password harus diisi' })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, {
    message: `Password minimal ${PASSWORD_MIN_LENGTH} karakter`,
  })
  @IsStrongPassword({
    message:
      'Password harus mengandung huruf besar, huruf kecil, angka, dan karakter spesial',
  })
  newPassword: string;
}

/**
 * DTO untuk check activation status
 */
export class CheckActivationStatusDto {
  @ApiProperty({
    description: 'Username atau email pengguna',
    example: 'johndoe',
  })
  @IsNotEmpty({ message: 'Username atau email harus diisi' })
  @IsString()
  usernameOrEmail: string;
}
