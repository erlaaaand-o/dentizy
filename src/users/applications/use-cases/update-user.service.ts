import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserRepository } from '../../infrastructures/repositories/user.repository';
import { UserValidationService } from '../../domains/services/user-validation.service';
import { UserMapper } from '../../domains/mappers/user.mapper';
import { UserResponseDto } from '../dto/user-response.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  UserUpdatedEvent,
  UserChanges,
  UserChangeValue,
} from '../../infrastructures/events/user-updated.event';
import { UsernameValidator } from '../../domains/validators/username.validator';
import { UserDataValidator } from '../../domains/validators/user-data.validator';
import { PasswordHasherService } from '../../../auth/infrastructures/security/password-hasher.service';

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
    const {
      roles: roleIds,
      username,
      nama_lengkap,
      email,
      password,
    } = updateUserDto;

    try {
      const user = await this.userRepository.findByIdWithPassword(userId);
      this.userValidation.validateUserExists(user, userId);

      if (!user) {
        throw new BadRequestException(`User with id ${userId} not found`);
      }

      const changes: Record<string, UserChangeValue> = {};

      if (username && username !== user.username) {
        UsernameValidator.validate(username);
        const existingUser =
          await this.userRepository.findByUsernameWithoutPassword(username);
        this.userValidation.validateUsernameUniqueness(
          existingUser,
          username,
          user.username,
        );
        user.username = username;
        changes.username = username;
      }

      if (nama_lengkap && nama_lengkap !== user.nama_lengkap) {
        UserDataValidator.validateNamaLengkap(nama_lengkap);
        user.nama_lengkap = nama_lengkap;
        changes.nama_lengkap = nama_lengkap;
      }

      if (email !== undefined && email !== user.email) {
        if (email === '') {
          user.email = null;
          changes.email = null;
        } else {
          await this.userValidation.validateUniqueEmail(email, userId);
          user.email = email;
          changes.email = email;
        }
      }

      if (password) {
        const hashedPassword = await this.passwordHasher.hash(password);
        user.password = hashedPassword;
        changes.password = '***CHANGED***';
      }

      if (roleIds && roleIds.length > 0) {
        UserDataValidator.validateRoles(roleIds);
        const roles = await this.userRepository.findRolesByIds(roleIds);
        this.userValidation.validateRolesExist(roleIds, roles);
        user.roles = roles;
        changes.roles = roleIds;
      }

      const updatedUser = await this.userRepository.update(user);

      this.eventEmitter.emit(
        'user.updated',
        new UserUpdatedEvent(updatedUser.id, updatedUser.username, changes),
      );

      this.logger.log(
        `✅ User updated: ${updatedUser.username} (ID: ${updatedUser.id})`,
      );
      return UserMapper.toResponseDto(updatedUser);
    } catch (error) {
      this.logger.error(
        `Error updating user ID ${userId}:`,
        error instanceof Error ? error.message : 'Unknown error',
      );
      throw error;
    }
  }
}
