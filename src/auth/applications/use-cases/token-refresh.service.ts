// application/use-cases/token-refresh.service.ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { UsersService } from '../../../users/applications/orchestrator/users.service';
import { AuthMapper } from '../../domains/mappers/auth.mapper';
import { TokenService } from '../../domains/services/token.service';
import { TokenRefreshedEvent } from '../../infrastructures/events/token-refreshed.event';

@Injectable()
export class TokenRefreshService {
  private readonly logger = new Logger(TokenRefreshService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Refresh user token
   */
  async execute(userId: string): Promise<{ access_token: string }> {
    try {
      // 1. Find user - properly typed as User entity
      const user = await this.usersService.findOneForAuth(userId);

      if (!user) {
        throw new UnauthorizedException('User tidak ditemukan');
      }

      // TypeScript now knows 'user' is User type, not any
      // 2. Generate new token
      const tokenPayload = AuthMapper.toTokenPayload(user);
      const accessToken = this.tokenService.generateToken(tokenPayload);

      // 3. Emit event
      this.eventEmitter.emit(
        'token.refreshed',
        new TokenRefreshedEvent(user.id, user.username),
      );

      // 4. Return new token
      this.logger.log(`✅ Token refreshed for user: ${user.username}`);
      return { access_token: accessToken };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Error refreshing token', error);
      throw new UnauthorizedException('Gagal refresh token');
    }
  }
}
