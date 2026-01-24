// backend/src/users/applications/dto/account-activation-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class RequestActivationResponseDto {
  @ApiProperty({
    example: 'Email aktivasi telah dikirim. Silakan cek inbox Anda.',
  })
  message: string;

  @ApiProperty({
    example: 'j***e@example.com',
    description: 'Email yang disamarkan untuk privasi',
  })
  email: string;

  @ApiProperty({
    example: 24,
    description: 'Waktu kedaluwarsa link aktivasi dalam jam',
  })
  expiresInHours: number;
}

export class VerifyActivationTokenResponseDto {
  @ApiProperty({
    example: true,
  })
  valid: boolean;

  @ApiProperty({
    example: 'Token valid. Silakan set password Anda.',
  })
  message: string;

  @ApiProperty({
    example: 'user-uuid-123',
    required: false,
  })
  userId?: string;

  @ApiProperty({
    example: 'john@example.com',
    required: false,
  })
  email?: string;
}

export class ActivateAccountResponseDto {
  @ApiProperty({
    example: 'Akun berhasil diaktivasi! Silakan login dengan password Anda.',
  })
  message: string;

  @ApiProperty({
    example: 'johndoe',
  })
  username: string;
}

export class CheckActivationStatusResponseDto {
  @ApiProperty({
    example: true,
    description: 'Apakah user dapat meminta aktivasi',
  })
  canActivate: boolean;

  @ApiProperty({
    example: false,
    description: 'Apakah akun sudah aktif',
  })
  isActive: boolean;

  @ApiProperty({
    example: true,
    description: 'Apakah user memiliki email',
  })
  hasEmail: boolean;

  @ApiProperty({
    example: 'User dapat meminta aktivasi akun',
  })
  message: string;
}
