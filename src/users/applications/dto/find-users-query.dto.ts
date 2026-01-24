import {
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  IsString,
  IsBoolean,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../roles/entities/role.entity';

export class FindUsersQueryDto {
  @ApiProperty({
    required: false,
    enum: UserRole,
    description: 'Filter berdasarkan role pengguna',
    example: UserRole.DOKTER,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Role tidak valid' })
  role?: UserRole;

  @ApiProperty({
    required: false,
    description: 'Pencarian berdasarkan nama atau username',
    example: 'andi',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;

  @ApiProperty({
    required: false,
    description: 'Halaman ke berapa',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Page minimal 1' })
  page?: number = 1;

  @ApiProperty({
    required: false,
    description: 'Jumlah data per halaman (maksimal 100)',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100, { message: 'Limit maksimal 100' })
  limit?: number = 10;

  @ApiProperty({
    required: false,
    description: 'Filter berdasarkan status aktif',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'isActive harus berupa boolean (true/false)' })
  isActive?: boolean;
}
