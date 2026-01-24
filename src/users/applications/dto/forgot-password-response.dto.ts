import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordResponseDto {
  @ApiProperty({
    example: 'Kode OTP telah dikirim ke email Anda',
  })
  message: string;

  @ApiProperty({
    example: 'j***e@example.com',
    description: 'Email yang disamarkan untuk privasi',
  })
  email: string;

  @ApiProperty({
    example: 5,
    description: 'Waktu kedaluwarsa OTP dalam menit',
  })
  expiresInMinutes: number;
}

export class VerifyOTPResponseDto {
  @ApiProperty({
    example: true,
  })
  valid: boolean;

  @ApiProperty({
    example: 'Kode OTP valid',
  })
  message: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: false,
    description: 'Reset token untuk reset password (hanya ada jika valid=true)',
  })
  resetToken?: string;
}
