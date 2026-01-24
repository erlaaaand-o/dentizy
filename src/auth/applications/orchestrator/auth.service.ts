// application/orchestrator/auth.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { LoginService } from '../use-cases/login.service';
import { TokenVerificationService } from '../use-cases/token-verification.service';
import { TokenRefreshService } from '../use-cases/token-refresh.service';
import { LogoutService } from '../use-cases/logout.service';
import { LoginDto } from '../dto/login.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { VerifyTokenResponseDto } from '../dto/verify-token.dto';

/**
 * Auth Service - Orchestrator
 * Delegates to specific use cases
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly loginService: LoginService,
    private readonly tokenVerificationService: TokenVerificationService,
    private readonly tokenRefreshService: TokenRefreshService,
    private readonly logoutService: LogoutService,
  ) {}

  /**
   * Login user
   */
  async login(
    loginDto: LoginDto,
    metadata?: { ipAddress?: string; userAgent?: string },
  ): Promise<LoginResponseDto> {
    return this.loginService.execute(loginDto, metadata);
  }

  /**
   * Verify token
   */
  async verifyToken(token: string): Promise<VerifyTokenResponseDto> {
    return this.tokenVerificationService.execute(token);
  }

  /**
   * Refresh token
   */
  async refreshToken(userId: string): Promise<{ access_token: string }> {
    return this.tokenRefreshService.execute(userId);
  }

  /**
   * Logout user
   */
  async logout(userId: string): Promise<{ message: string }> {
    return this.logoutService.execute(userId);
  }
}
