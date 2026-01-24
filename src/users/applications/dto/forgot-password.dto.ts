import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO untuk request OTP
 */
export class ForgotPasswordRequestDto {
  @ApiProperty({
    description: 'Email atau username pengguna',
    example: 'johndoe@example.com',
  })
  @IsNotEmpty({ message: 'Email atau username harus diisi' })
  @IsString()
  emailOrUsername: string;
}

/**
 * DTO untuk verifikasi OTP
 */
export class VerifyOTPDto {
  @ApiProperty({
    description: 'Email pengguna',
    example: 'johndoe@example.com',
  })
  @IsNotEmpty({ message: 'Email harus diisi' })
  @IsString()
  email: string;

  @ApiProperty({
    description: 'Kode OTP 6 digit',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsNotEmpty({ message: 'Kode OTP harus diisi' })
  @IsString()
  @IsString()
  otp: string;
}

/**
 * DTO untuk reset password dengan token
 */
export class ResetPasswordWithTokenDto {
  @ApiProperty({
    description: 'Reset token dari verifikasi OTP',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsNotEmpty({ message: 'Reset token harus diisi' })
  @IsString()
  resetToken: string;

  @ApiProperty({
    description: 'Password baru',
    example: 'NewPassword123!',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'Password baru harus diisi' })
  @IsString()
  newPassword: string;
}
