// backend/src/users/applications/dto/account-activation.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

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
