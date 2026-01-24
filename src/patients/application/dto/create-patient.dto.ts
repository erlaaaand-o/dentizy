import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  IsEnum,
  IsDateString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '../../domains/entities/patient.entity';

export class CreatePatientDto {
  @ApiProperty({ example: 'Dr. John Doe', description: 'Nama lengkap pasien' })
  @IsNotEmpty({ message: 'Nama lengkap harus diisi' })
  @IsString({ message: 'Nama lengkap harus berupa text' })
  @MinLength(3, { message: 'Nama lengkap minimal 3 karakter' })
  @MaxLength(250, { message: 'Nama lengkap maksimal 250 karakter' })
  @Transform(({ value }) => value?.trim())
  nama_lengkap: string;

  @ApiPropertyOptional({
    example: '3201234567890123',
    description: 'NIK 16 digit',
  })
  @IsOptional()
  @IsString({ message: 'NIK harus berupa text' })
  @Length(16, 16, { message: 'NIK harus 16 digit' })
  @Matches(/^\d{16}$/, { message: 'NIK harus berupa 16 digit angka' })
  @Transform(({ value }) => value?.trim())
  nik?: string;

  @ApiPropertyOptional({ example: 'john.doe@email.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Format email tidak valid' })
  @MaxLength(250, { message: 'Email maksimal 250 karakter' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  @ApiPropertyOptional({ example: '081234567890' })
  @IsOptional()
  @IsString({ message: 'Nomor HP harus berupa text' })
  @Matches(/^(\+62|62|0)[0-9]{9,13}$/, {
    message: 'Format nomor HP tidak valid (contoh: 081234567890)',
  })
  @Transform(({ value }) => value?.trim().replace(/\s+/g, ''))
  no_hp?: string;

  @ApiPropertyOptional({ example: '1990-01-15' })
  @IsOptional()
  @IsDateString({}, { message: 'Format tanggal tidak valid (YYYY-MM-DD)' })
  tanggal_lahir?: string;

  @ApiPropertyOptional({ enum: Gender, example: Gender.MALE })
  @IsOptional()
  @IsEnum(Gender, { message: 'Jenis kelamin harus L atau P' })
  jenis_kelamin?: Gender;

  @ApiPropertyOptional({ example: 'Jl. Sudirman No. 123' })
  @IsOptional()
  @IsString({ message: 'Alamat harus berupa text' })
  @MaxLength(500, { message: 'Alamat maksimal 500 karakter' })
  @Transform(({ value }) => value?.trim())
  alamat?: string;
}
