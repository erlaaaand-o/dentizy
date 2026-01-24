// application/use-cases/reset-password.service.ts
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { UserRepository } from '../../infrastructures/repositories/user.repository';
import { UserValidationService } from '../../domains/services/user-validation.service';
import { PasswordHasherService } from '../../../auth/infrastructures/security/password-hasher.service';
import { PasswordPolicyService } from '../../domains/services/password-policy.service';
import { PasswordChangeResponseDto } from '../dto/password-change-response.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PasswordChangedEvent } from '../../infrastructures/events/password-changed.event';

@Injectable()
export class ResetPasswordService {
  private readonly logger = new Logger(ResetPasswordService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly userValidation: UserValidationService,
    private readonly passwordHasher: PasswordHasherService,
    private readonly passwordPolicy: PasswordPolicyService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    userId: string,
    newPassword: string,
    resetByAdmin: boolean = true,
  ): Promise<PasswordChangeResponseDto> {
    try {
      // 1. Find user
      const user = await this.userRepository.findByIdWithPassword(userId);
      this.userValidation.validateUserExists(user, userId);

      if (!user) {
        throw new BadRequestException(`User with id ${userId} not found`);
      }

      // 2. Validate password strength
      const strengthCheck =
        this.passwordPolicy.validatePasswordStrength(newPassword);
      if (!strengthCheck.valid) {
        throw new Error(
          `Password tidak memenuhi kriteria: ${strengthCheck.errors.join(', ')}`,
        );
      }

      // 3. Hash new password
      const hashedPassword = await this.passwordHasher.hash(newPassword);
      user.password = hashedPassword;

      // 4. Save changes
      await this.userRepository.update(user);

      // 5. Emit event
      this.eventEmitter.emit(
        'password.changed',
        new PasswordChangedEvent(
          user.id,
          user.username,
          resetByAdmin ? 'admin' : 'self',
        ),
      );

      // 6. Log and return
      this.logger.log(
        `✅ Password reset for user: ${user.username} (ID: ${userId}) by ${resetByAdmin ? 'admin' : 'self'}`,
      );

      return {
        message: `Password berhasil direset untuk user ${user.username}`,
        timestamp: new Date().toISOString(),
        user: {
          id: user.id,
          username: user.username,
        },
      };
    } catch (error) {
      this.logger.error('Error resetting password:', error.message);
      throw error;
    }
  }

  /**
   * Generate and set temporary password
   */
  async generateTemporaryPassword(userId: string): Promise<{
    temporaryPassword: string;
    message: string;
  }> {
    try {
      // 1. Find user
      const user = await this.userRepository.findByIdWithPassword(userId);
      this.userValidation.validateUserExists(user, userId);

      if (!user) {
        throw new BadRequestException(`User with id ${userId} not found`);
      }

      // 2. Generate temporary password
      const temporaryPassword = this.passwordPolicy.generateTemporaryPassword();

      // 3. Hash and save
      const hashedPassword = await this.passwordHasher.hash(temporaryPassword);
      user.password = hashedPassword;
      await this.userRepository.update(user);

      // 4. Emit event
      this.eventEmitter.emit(
        'password.changed',
        new PasswordChangedEvent(user.id, user.username, 'admin'),
      );

      // 5. Log and return
      this.logger.log(
        `✅ Temporary password generated for user: ${user.username}`,
      );

      return {
        temporaryPassword,
        message: `Password sementara berhasil dibuat untuk ${user.username}`,
      };
    } catch (error) {
      this.logger.error('Error generating temporary password:', error.message);
      throw error;
    }
  }
}
