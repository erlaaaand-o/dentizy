// domains/mappers/auth.mapper.ts
import { User } from '../../../users/domains/entities/user.entity';
import { LoginResponseDto } from '../../applications/dto/login-response.dto';
import { TokenPayloadDto } from '../../applications/dto/token-payload.dto';

export class AuthMapper {
  /**
   * Map User entity to TokenPayload
   */
  static toTokenPayload(user: User): TokenPayloadDto {
    return {
      userId: user.id,
      username: user.username,
      roles: user.roles?.map((role) => role.name) || [],
    };
  }

  /**
   * Map User entity to LoginResponse
   */
  static toLoginResponse(user: User, accessToken: string): LoginResponseDto {
    return {
      access_token: accessToken,
      user: {
        id: user.id,
        username: user.username,
        nama_lengkap: user.nama_lengkap,
        roles: user.roles?.map((role) => role.name) || [],
      },
    };
  }

  /**
   * Remove sensitive data from user object
   */
  static sanitizeUser(user: User): Omit<User, 'password'> {
    const { password, ...sanitized } = user;
    return sanitized;
  }
}
