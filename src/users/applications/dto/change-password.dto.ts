import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import {
  IsStrongPassword,
  PASSWORD_MIN_LENGTH,
} from '../../../shared/validators/password.validator';
import { Match } from '../../../shared/validators/match.validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Password lama yang saat ini digunakan user',
    type: String,
    example: 'OldPassword123!',
  })
  @IsNotEmpty({ message: 'Password lama harus diisi' })
  @IsString()
  oldPassword: string;

  @ApiProperty({
    description: `Password baru yang akan digunakan. Minimal ${PASSWORD_MIN_LENGTH} karakter, harus mengandung huruf besar, huruf kecil, angka, dan karakter spesial`,
    type: String,
    example: 'NewStrongPassword123!',
    minLength: PASSWORD_MIN_LENGTH,
  })
  @IsNotEmpty({ message: 'Password baru harus diisi' })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, {
    message: `Password baru minimal ${PASSWORD_MIN_LENGTH} karakter`,
  })
  @IsStrongPassword({
    message:
      'Password baru harus memiliki huruf besar, huruf kecil, angka, dan karakter spesial',
  })
  newPassword: string;

  @ApiProperty({
    description:
      'Konfirmasi password baru, harus sama dengan field newPassword',
    type: String,
    example: 'NewStrongPassword123!',
  })
  @IsNotEmpty({ message: 'Konfirmasi password harus diisi' })
  @IsString()
  @Match('newPassword', {
    message: 'Konfirmasi password tidak sesuai dengan password baru',
  })
  confirmPassword: string;
}
