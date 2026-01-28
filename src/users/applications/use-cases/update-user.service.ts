import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { PasswordHasherService } from '../../../auth/infrastructures/security/password-hasher.service';
import { User } from '../../domains/entities/user.entity';
import { UserMapper } from '../../domains/mappers/user.mapper';
import { UserValidationService } from '../../domains/services/user-validation.service';
import { UserDataValidator } from '../../domains/validators/user-data.validator';
import { UsernameValidator } from '../../domains/validators/username.validator';
import {
  UserUpdatedEvent,
  UserChangeValue,
} from '../../infrastructures/events/user-updated.event';
import { UserRepository } from '../../infrastructures/repositories/user.repository';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';

@Injectable()
export class UpdateUserService {
  private readonly logger = new Logger(UpdateUserService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly userValidation: UserValidationService,
    private readonly passwordHasher: PasswordHasherService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    try {
      const user = await this.userRepository.findByIdWithPassword(userId);

      if (!user) {
        throw new BadRequestException(`User with id ${userId} not found`);
      }

      // Validasi status aktif/exist user
      this.userValidation.validateUserExists(user, userId);

      const changes: Record<string, UserChangeValue> = {};

      // Proses update field satu per satu
      await this.handleUsernameUpdate(user, updateUserDto.username, changes);
      this.handleFullNameUpdate(user, updateUserDto.nama_lengkap, changes);
      await this.handleEmailUpdate(user, updateUserDto.email, changes);
      await this.handlePasswordUpdate(user, updateUserDto.password, changes);
      await this.handleRolesUpdate(user, updateUserDto.roles, changes);

      const updatedUser = await this.userRepository.update(user);

      this.emitUserUpdatedEvent(updatedUser, changes);

      this.logger.log(
        `✅ User updated: ${updatedUser.username} (ID: ${updatedUser.id})`,
      );

      return UserMapper.toResponseDto(updatedUser);
    } catch (error) {
      this.handleError(userId, error);
    }
  }

  private async handleUsernameUpdate(
    user: User,
    newUsername: string | undefined,
    changes: Record<string, UserChangeValue>,
  ): Promise<void> {
    if (!newUsername || newUsername === user.username) return;

    UsernameValidator.validate(newUsername);

    const existingUser =
      await this.userRepository.findByUsernameWithoutPassword(newUsername);

    this.userValidation.validateUsernameUniqueness(
      existingUser,
      newUsername,
      user.username,
    );

    user.username = newUsername;
    changes.username = newUsername;
  }

  private handleFullNameUpdate(
    user: User,
    newName: string | undefined,
    changes: Record<string, UserChangeValue>,
  ): void {
    if (!newName || newName === user.nama_lengkap) return;

    UserDataValidator.validateNamaLengkap(newName);
    user.nama_lengkap = newName;
    changes.nama_lengkap = newName;
  }

  private async handleEmailUpdate(
    user: User,
    newEmail: string | undefined,
    changes: Record<string, UserChangeValue>,
  ): Promise<void> {
    if (newEmail === undefined || newEmail === user.email) return;

    if (newEmail === '') {
      user.email = null;
      changes.email = null;
      return;
    }

    await this.userValidation.validateUniqueEmail(newEmail, user.id);
    user.email = newEmail;
    changes.email = newEmail;
  }

  private async handlePasswordUpdate(
    user: User,
    newPassword: string | undefined,
    changes: Record<string, UserChangeValue>,
  ): Promise<void> {
    if (!newPassword) return;

    const hashedPassword = await this.passwordHasher.hash(newPassword);
    user.password = hashedPassword;
    changes.password = '***CHANGED***';
  }

  private async handleRolesUpdate(
    user: User,
    roleIds: string[] | undefined,
    changes: Record<string, UserChangeValue>,
  ): Promise<void> {
    if (!roleIds || roleIds.length === 0) return;

    UserDataValidator.validateRoles(roleIds);
    const roles = await this.userRepository.findRolesByIds(roleIds);
    this.userValidation.validateRolesExist(roleIds, roles);

    user.roles = roles;
    changes.roles = roleIds;
  }

  private emitUserUpdatedEvent(
    user: User,
    changes: Record<string, UserChangeValue>,
  ): void {
    if (Object.keys(changes).length > 0) {
      this.eventEmitter.emit(
        'user.updated',
        new UserUpdatedEvent(user.id, user.username, changes),
      );
    }
  }

  private handleError(userId: string, error: unknown): never {
    this.logger.error(
      `Error updating user ID ${userId}:`,
      error instanceof Error ? error.message : 'Unknown error',
    );
    throw error;
  }
}
