import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Pastikan path import validator ini sesuai dengan struktur project Anda
import {
  IsStrongPassword,
  PASSWORD_MIN_LENGTH,
} from '../../../shared/validators/password.validator';

export class UpdateUserDto {
  @ApiProperty({
    required: false,
    description: 'Nama lengkap pengguna',
    example: 'Adi Saputra',
  })
  @IsOptional()
  @IsString({ message: 'Nama lengkap harus berupa teks' })
  nama_lengkap?: string;

  @ApiProperty({
    required: false,
    description: 'Username baru untuk login',
    example: 'adi.saputra',
  })
  @IsOptional()
  @IsString({ message: 'Username harus berupa teks' })
  username?: string;

  // [FIX] Tambahkan Field Email
  @ApiProperty({
    required: false,
    description: 'Email pengguna',
    example: 'adi@dentizy.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Format email tidak valid' })
  email?: string;

  // [FIX] Tambahkan Field Password (Opsional untuk reset)
  @ApiProperty({
    required: false,
    description: 'Password baru (kosongkan jika tidak ingin mengubah)',
    example: 'NewPass123!',
  })
  @IsOptional()
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, {
    message: `Password minimal ${PASSWORD_MIN_LENGTH} karakter`,
  })
  @IsStrongPassword()
  password?: string;

  @ApiProperty({
    required: false,
    description: 'Daftar ID role pengguna',
    example: ['UUID-role-lain'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Roles harus berupa array' })
  @IsString({ each: true, message: 'Setiap role harus berupa teks' })
  roles?: string[];
}
