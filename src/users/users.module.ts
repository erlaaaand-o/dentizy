import { Module, forwardRef } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { PasswordHasherService } from '../auth/infrastructures/security/password-hasher.service';
import { TimingDefenseService } from '../auth/infrastructures/security/timing-defense.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { Role } from '../roles/entities/role.entity';

import { UsersService } from './applications/orchestrator/users.service';
import { AccountActivationService } from './applications/use-cases/account-activation.service';
import { ChangePasswordService } from './applications/use-cases/change-password.service';
import { CreateUserService } from './applications/use-cases/create-user.service';
import { DeleteUserService } from './applications/use-cases/delete-user.service';
import { FindUsersService } from './applications/use-cases/find-users.service';
import { ForgotPasswordService } from './applications/use-cases/forgot-password.service';
import { ResetPasswordService } from './applications/use-cases/reset-password.service';
import { UpdateUserService } from './applications/use-cases/update-user.service';
import { User } from './domains/entities/user.entity';
import { PasswordPolicyService } from './domains/services/password-policy.service';
import { UserValidationService } from './domains/services/user-validation.service';
import { PasswordChangedListener } from './infrastructures/listeners/password-changed.listener';
import { UserCreatedListener } from './infrastructures/listeners/user-created.listener';
import { UserRepository } from './infrastructures/repositories/user.repository';
import { UserExceptionFilter } from './interface/filters/user-exception.filter';
import { ValidationExceptionFilter } from './interface/filters/validation-exception.filter';
import { UsersController } from './interface/http/users.controller';

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
