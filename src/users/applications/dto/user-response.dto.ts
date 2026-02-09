// users/applications/dto/user-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

// 1. Pisahkan Role menjadi Class sendiri agar bisa di-transform
export class UserRoleDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: string;

  @ApiProperty({ example: 'DOCTOR' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'Medical Staff' })
  @Expose()
  description: string;
}

// 2. Main DTO
export class UserResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: string;

  @ApiProperty({ example: 'johndoe' })
  @Expose()
  username: string;

  @ApiProperty({ example: 'Dr. John Doe' })
  @Expose()
  nama_lengkap: string;

  @ApiProperty({
    example: 'dokter@klinik.com',
    required: false,
    nullable: true,
  })
  @Expose()
  email?: string;

  @ApiProperty({ type: [UserRoleDto], description: 'Daftar role user' })
  @Expose()
  @Type(() => UserRoleDto) // PENTING: Agar array object berubah jadi instance UserRoleDto
  roles: UserRoleDto[];

  @ApiProperty()
  @Expose()
  @Type(() => Date)
  created_at: Date;

  @ApiProperty()
  @Expose()
  @Type(() => Date)
  updated_at: Date;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  @Type(() => Date)
  deleted_at?: Date | null;

  @ApiProperty({ example: true, description: 'Status aktif user' })
  @Expose()
  is_active: boolean;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  profile_photo?: string | null;
}
