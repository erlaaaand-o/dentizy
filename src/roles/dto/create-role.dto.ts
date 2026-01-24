import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../entities/role.entity';

export class CreateRoleDto {
  @IsNotEmpty({ message: 'Role name is required' })
  @IsEnum(UserRole, { message: 'Invalid role type' })
  name: UserRole;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;
}
