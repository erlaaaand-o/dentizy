// users.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from '../auth/auth.module';

// Entities
import { User } from './domains/entities/user.entity';
import { Role } from '../roles/entities/role.entity';

// Controllers
import { UsersController } from './interface/http/users.controller';

// Orchestrator
import { UsersService } from './applications/orchestrator/users.service';

// Use Cases
import { CreateUserService } from './applications/use-cases/create-user.service';
import { UpdateUserService } from './applications/use-cases/update-user.service';
import { DeleteUserService } from './applications/use-cases/delete-user.service';
import { FindUsersService } from './applications/use-cases/find-users.service';
import { ChangePasswordService } from './applications/use-cases/change-password.service';
import { ResetPasswordService } from './applications/use-cases/reset-password.service';
import { ForgotPasswordService } from './applications/use-cases/forgot-password.service';
import { AccountActivationService } from './applications/use-cases/account-activation.service';

// Domain Services
import { UserValidationService } from './domains/services/user-validation.service';
import { PasswordPolicyService } from './domains/services/password-policy.service';

// Infrastructure
import { UserRepository } from './infrastructures/repositories/user.repository';

// Import from Auth module
import { PasswordHasherService } from '../auth/infrastructures/security/password-hasher.service';
import { TimingDefenseService } from '../auth/infrastructures/security/timing-defense.service';

import { APP_FILTER } from '@nestjs/core';
import { UserExceptionFilter } from './interface/filters/user-exception.filter';
import { ValidationExceptionFilter } from './interface/filters/validation-exception.filter';

// import notification module
import { NotificationsModule } from '../notifications/notifications.module';
import { UserCreatedListener } from './infrastructures/listeners/user-created.listener';
import { PasswordChangedListener } from './infrastructures/listeners/password-changed.listener';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    TypeOrmModule.forFeature([User, Role]),
    NotificationsModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [UsersController],
  providers: [
    // Orchestrator
    UsersService,

    // Use Cases
    CreateUserService,
    UpdateUserService,
    DeleteUserService,
    FindUsersService,
    ChangePasswordService,
    ResetPasswordService,
    ForgotPasswordService,
    AccountActivationService,

    // Domain Services
    UserValidationService,
    PasswordPolicyService,

    // Infrastructure
    UserRepository,

    // Event Listeners
    UserCreatedListener,
    PasswordChangedListener,

    // Shared Services from Auth
    PasswordHasherService,
    TimingDefenseService,

    {
      provide: APP_FILTER,
      useClass: UserExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ValidationExceptionFilter,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
