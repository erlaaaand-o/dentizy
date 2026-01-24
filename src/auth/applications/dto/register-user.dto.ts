import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import {
  IsStrongPassword,
  PASSWORD_MIN_LENGTH,
} from '../../../shared/validators/password.validator';

export class RegisterUserDto {
  @ApiProperty({
    description: 'Nama lengkap pengguna',
    example: 'Jhon Doe',
  })
  @IsNotEmpty()
  @IsString()
  nama_lengkap: string;

  @ApiProperty({
    description: 'Username pengguna',
    example: 'jhon.klinik',
  })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({
    description: 'Password akun',
    example: 'Rahasia123!',
    format: 'password',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, {
    message: `Password minimal ${PASSWORD_MIN_LENGTH} karakter`,
  })
  @IsStrongPassword() // ✅ Using centralized validator
  password: string;

  @ApiProperty({
    description: 'role pengguna',
  })
  @IsNotEmpty()
  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayMinSize(1, { message: 'Roles cannot be empty' })
  roles: number[]; // Array berisi ID role, contoh: [2] untuk 'staf'
}
