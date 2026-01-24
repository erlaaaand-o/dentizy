import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength, IsUrl } from 'class-validator';

/**
 * DTO untuk mengupdate profil pengguna yang sedang login.
 * Sengaja tidak menyertakan 'roles' untuk mencegah self-elevation.
 */
export class UpdateProfileDto {
  @ApiProperty({
    description: 'Username baru pengguna',
    example: 'erland_baru',
    required: false,
    minLength: 5,
  })
  @IsOptional()
  @IsString()
  @MinLength(5, { message: 'Username minimal harus 5 karakter' })
  username?: string;

  @ApiProperty({
    description: 'Nama lengkap baru pengguna',
    example: 'Erland Agsya V.2',
    required: false,
    minLength: 3,
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Nama lengkap minimal harus 3 karakter' })
  nama_lengkap?: string;

  @ApiProperty({
    required: false,
    description: 'URL foto profil (dari response upload)',
    example: '/uploads/profiles/foto-user-123.jpg',
  })
  @IsOptional()
  @IsString()
  profile_photo?: string;
}
