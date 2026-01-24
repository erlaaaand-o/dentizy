import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import {
  IsStrongPassword,
  PASSWORD_MIN_LENGTH,
} from '../../../shared/validators/password.validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Reset Password Pengguna',
  })
  @IsNotEmpty({ message: 'Password baru harus diisi' })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, {
    message: `Password minimal ${PASSWORD_MIN_LENGTH} karakter`,
  })
  @IsStrongPassword() // ✅ Using centralized validator
  newPassword: string;
}
