// application/use-cases/login.service.ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { UsersService } from '../../../users/applications/orchestrator/users.service';
import { PasswordHasherService } from '../../infrastructures/security/password-hasher.service';
import { TimingDefenseService } from '../../infrastructures/security/timing-defense.service';
import { TokenService } from '../../domains/services/token.service';
import { SecurityGuardService } from '../../domains/services/security-guard.service';
import { AuthMapper } from '../../domains/mappers/auth.mapper';
import { LoginDto } from '../dto/login.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserLoggedInEvent } from '../../infrastructures/events/user-logged-in.event';

/**
 * Interface untuk metadata login
 */
interface LoginMetadata {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class LoginService {
  private readonly logger = new Logger(LoginService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly passwordHasher: PasswordHasherService,
    private readonly timingDefense: TimingDefenseService,
    private readonly tokenService: TokenService,
    private readonly securityGuard: SecurityGuardService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Execute login use case
   */
  async execute(
    loginDto: LoginDto,
    metadata?: LoginMetadata,
  ): Promise<LoginResponseDto> {
    return this.timingDefense.executeWithProtection(async () => {
      const { username, password } = loginDto;

      // 1. Check if account is locked
      if (this.securityGuard.isAccountLocked(username)) {
        const remainingTime =
          this.securityGuard.getRemainingLockoutTime(username);
        throw new UnauthorizedException(
          `Akun terkunci. Coba lagi dalam ${remainingTime} detik.`,
        );
      }

      // 2. Find user
      const user = await this.usersService.findByUsernameOrEmail(username);

      // 3. Verify password (always compare even if user not found)
      const passwordToCheck = user?.password || null;
      const isPasswordValid = passwordToCheck
        ? await this.passwordHasher.compare(password, passwordToCheck)
        : await this.passwordHasher.dummyCompare(password);

      // 4. Validate credentials
      if (!user || !isPasswordValid) {
        this.securityGuard.recordFailedAttempt(username);
        this.logger.warn(`Failed login attempt for username: ${username}`);
        throw new UnauthorizedException('Username atau password salah');
      }

      // 5. Clear failed attempts on successful login
      this.securityGuard.clearFailedAttempts(username);

      // 6. Generate token
      const tokenPayload = AuthMapper.toTokenPayload(user);
      const accessToken = this.tokenService.generateToken(tokenPayload);

      // 7. Emit event
      this.eventEmitter.emit(
        'user.logged-in',
        new UserLoggedInEvent(
          user.id,
          user.username,
          new Date(),
          metadata?.ipAddress,
          metadata?.userAgent,
        ),
      );

      // 8. Return response
      this.logger.log(`✅ User logged in: ${user.username}`);
      return AuthMapper.toLoginResponse(user, accessToken);
    });
  }
}
