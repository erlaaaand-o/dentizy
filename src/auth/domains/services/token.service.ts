// domains/services/token.service.ts
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenPayloadDto } from '../../applications/dto/token-payload.dto';

/**
 * Interface untuk JWT payload yang di-decode
 */
interface JwtPayload {
  username: string;
  sub: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

/**
 * Interface untuk decoded token (tanpa verifikasi)
 */
interface DecodedToken {
  username: string;
  sub: number;
  roles: string[];
  iat?: number;
  exp?: number;
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(private readonly jwtService: JwtService) {}

  /**
   * Generate JWT token from user payload
   */
  generateToken(payload: TokenPayloadDto): string {
    try {
      const token = this.jwtService.sign({
        username: payload.username,
        sub: payload.userId,
        roles: payload.roles,
      });

      this.logger.debug(`Token generated for user ID: ${payload.userId}`);
      return token;
    } catch (error) {
      this.logger.error('Failed to generate token', error);
      throw new Error('Token generation failed');
    }
  }

  /**
   * Verify and decode JWT token
   */
  verifyToken(token: string): TokenPayloadDto {
    try {
      const decoded = this.jwtService.verify<JwtPayload>(token);

      return {
        userId: decoded.sub,
        username: decoded.username,
        roles: decoded.roles || [],
      };
    } catch (error) {
      this.logger.warn(
        'Token verification failed',
        error instanceof Error ? error.message : 'Unknown error',
      );
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token: string): DecodedToken | null {
    try {
      const decoded = this.jwtService.decode(token);

      // Validate that decoded is a proper object with expected structure
      if (!decoded || typeof decoded !== 'object' || !('sub' in decoded)) {
        this.logger.warn('Invalid token structure');
        return null;
      }

      return decoded as DecodedToken;
    } catch (error) {
      this.logger.warn(
        'Failed to decode token',
        error instanceof Error ? error.message : 'Unknown error',
      );
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      this.jwtService.verify(token);
      return false;
    } catch (error) {
      return true;
    }
  }
}
