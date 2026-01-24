import { IsOptional, IsString, IsEnum } from 'class-validator';
import { UserRole } from '../entities/role.entity';

export class UpdateRoleDto {
  @IsOptional()
  @IsEnum(UserRole, { message: 'name must be a valid UserRole enum value' })
  name?: UserRole;

  @IsOptional()
  @IsString()
  description?: string;
}
