// application/use-cases/token-verification.service.ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { TokenService } from '../../domains/services/token.service';
import { UsersService } from '../../../users/applications/orchestrator/users.service';
import { VerifyTokenResponseDto } from '../dto/verify-token.dto';

@Injectable()
export class TokenVerificationService {
  private readonly logger = new Logger(TokenVerificationService.name);

  constructor(
    private readonly tokenService: TokenService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Verify token and return user info
   */
  async execute(token: string): Promise<VerifyTokenResponseDto> {
    try {
      // 1. Verify token
      const payload = this.tokenService.verifyToken(token);

      // 2. Check if user still exists
      const user = await this.usersService.findOne(payload.userId);
      if (!user) {
        throw new UnauthorizedException('User tidak ditemukan');
      }

      // 3. Return verification result
      return {
        valid: true,
        userId: payload.userId,
        username: payload.username,
        roles: payload.roles,
      };
    } catch (error) {
      this.logger.warn('Token verification failed');
      return {
        valid: false,
        message: 'Token tidak valid atau sudah kadaluarsa',
      };
    }
  }
}
