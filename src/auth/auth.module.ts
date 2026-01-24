// auth.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Controllers
import { AuthController } from './interface/http/auth.controller';

// Strategies
import { JwtStrategy } from './infrastructures/strategies/jwt.strategy';

// Orchestrator
import { AuthService } from './applications/orchestrator/auth.service';

// Use Cases
import { LoginService } from './applications/use-cases/login.service';
import { TokenVerificationService } from './applications/use-cases/token-verification.service';
import { TokenRefreshService } from './applications/use-cases/token-refresh.service';
import { LogoutService } from './applications/use-cases/logout.service';

// Domain Services
import { TokenService } from './domains/services/token.service';
import { CredentialValidationService } from './domains/services/credential-validation.service';
import { SecurityGuardService } from './domains/services/security-guard.service';

// Infrastructure Services
import { PasswordHasherService } from './infrastructures/security/password-hasher.service';
import { TimingDefenseService } from './infrastructures/security/timing-defense.service';

// Guards
import { RolesGuard } from './interface/guards/roles.guard';
import { JwtAuthGuard } from './interface/guards/jwt-auth.guard';

// External Modules
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
    }),
    EventEmitterModule.forRoot(),
  ],
  controllers: [AuthController],
  providers: [
    // Orchestrator
    AuthService,

    // Use Cases
    LoginService,
    TokenVerificationService,
    TokenRefreshService,
    LogoutService,

    // Domain Services
    TokenService,
    CredentialValidationService,
    SecurityGuardService,

    // Infrastructure Services
    PasswordHasherService,
    TimingDefenseService,

    // Strategies & Guards
    JwtStrategy,
    RolesGuard,
    JwtAuthGuard,
  ],
  exports: [AuthService, JwtStrategy, PassportModule, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
