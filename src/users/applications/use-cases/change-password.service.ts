// application/use-cases/change-password.service.ts
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { UserRepository } from '../../infrastructures/repositories/user.repository';
import { UserValidationService } from '../../domains/services/user-validation.service';
import { PasswordHasherService } from '../../../auth/infrastructures/security/password-hasher.service';
import { PasswordPolicyService } from '../../domains/services/password-policy.service';
import { PasswordChangeResponseDto } from '../dto/password-change-response.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PasswordChangedEvent } from '../../infrastructures/events/password-changed.event';
import { TimingDefenseService } from '../../../auth/infrastructures/security/timing-defense.service';

@Injectable()
export class ChangePasswordService {
  private readonly logger = new Logger(ChangePasswordService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly userValidation: UserValidationService,
    private readonly passwordHasher: PasswordHasherService,
    private readonly passwordPolicy: PasswordPolicyService,
    private readonly timingDefense: TimingDefenseService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<PasswordChangeResponseDto> {
    return this.timingDefense.executeWithProtection(async () => {
      try {
        // 1. Find user with password
        const user = await this.userRepository.findByIdWithPassword(userId);
        this.userValidation.validateUserExists(user, userId);

        // 2. Verify old password
        if (!user) {
          throw new BadRequestException(`User with id ${userId} not found`);
        }

        const isOldPasswordValid = await this.passwordHasher.compare(
          oldPassword,
          user.password,
        );

        if (!isOldPasswordValid) {
          throw new BadRequestException('Password lama tidak sesuai');
        }

        // 3. Validate new password policy
        this.passwordPolicy.validatePasswordChange(oldPassword, newPassword);

        // 4. Hash new password
        const hashedPassword = await this.passwordHasher.hash(newPassword);
        user.password = hashedPassword;

        // 5. Save changes
        await this.userRepository.update(user);

        // 6. Emit event
        this.eventEmitter.emit(
          'password.changed',
          new PasswordChangedEvent(user.id, user.username, 'self'),
        );

        // 7. Log and return
        this.logger.log(
          `✅ Password changed for user: ${user.username} (ID: ${userId})`,
        );

        return {
          message: 'Password berhasil diubah',
          timestamp: new Date().toISOString(),
          user: {
            id: user.id,
            username: user.username,
          },
        };
      } catch (error) {
        this.logger.error('Error changing password:', error.message);
        throw error;
      }
    });
  }
}
