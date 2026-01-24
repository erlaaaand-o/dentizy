// domains/mappers/user.mapper.ts
import { User } from '../entities/user.entity';
import { UserResponseDto } from '../../applications/dto/user-response.dto';

export class UserMapper {
  /**
   * Map User entity to UserResponse DTO (remove password)
   */
  static toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      username: user.username,
      nama_lengkap: user.nama_lengkap,
      email: user.email || undefined,
      roles:
        user.roles?.map((role) => ({
          id: role.id,
          name: role.name,
          description: role.description,
        })) || [],
      created_at: user.created_at,
      updated_at: user.updated_at,
      profile_photo: user.profile_photo || undefined,
    };
  }

  /**
   * Map array of users to response DTOs
   */
  static toResponseDtoArray(users: User[]): UserResponseDto[] {
    return users.map((user) => this.toResponseDto(user));
  }

  /**
   * Remove sensitive data from user
   */
  static sanitize(user: User): Omit<User, 'password'> {
    const { password, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Map user to summary (minimal info)
   */
  static toSummary(user: User): {
    id: string;
    username: string;
    nama_lengkap: string;
  } {
    return {
      id: user.id,
      username: user.username,
      nama_lengkap: user.nama_lengkap,
    };
  }
}
