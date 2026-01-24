// domains/services/user-validation.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../../infrastructures/repositories/user.repository';
import { User } from '../entities/user.entity';
import { Role } from '../../../roles/entities/role.entity';

interface CanDeleteResult {
  canDelete: boolean;
  reason?: string;
}

interface ValidationResult {
  valid: boolean;
  message?: string;
}

@Injectable()
export class UserValidationService {
  private readonly logger = new Logger(UserValidationService.name);

  constructor(private readonly userRepository: UserRepository) {}

  validateUsernameUniqueness(
    existingUser: User | null,
    newUsername: string,
    currentUsername?: string,
  ): void {
    if (existingUser && existingUser.username !== currentUsername) {
      throw new ConflictException(`Username "${newUsername}" sudah digunakan`);
    }
  }

  validateUserExists(user: User | null, userId: string): void {
    if (!user) {
      throw new NotFoundException(`User dengan ID #${userId} tidak ditemukan`);
    }
  }

  validateRolesExist(requestedRoleIds: string[], foundRoles: Role[]): void {
    if (foundRoles.length !== requestedRoleIds.length) {
      const foundIds = foundRoles.map((r) => r.id);
      const missingIds = requestedRoleIds.filter(
        (id) => !foundIds.includes(id),
      );
      throw new NotFoundException(
        `Role dengan ID ${missingIds.join(', ')} tidak ditemukan`,
      );
    }
  }

  validatePasswordsMatch(password: string, confirmPassword: string): void {
    if (password !== confirmPassword) {
      throw new ConflictException(
        'Password dan konfirmasi password tidak sama',
      );
    }
  }

  validateCanDelete(user: User): CanDeleteResult {
    if (user.medical_records && user.medical_records.length > 0) {
      return {
        canDelete: false,
        reason: 'User memiliki medical records dan tidak dapat dihapus',
      };
    }
    return { canDelete: true };
  }

  validateUsernameFormat(username: string): ValidationResult {
    if (!username || username.trim().length === 0) {
      return { valid: false, message: 'Username tidak boleh kosong' };
    }

    if (username.length < 3) {
      return { valid: false, message: 'Username minimal 3 karakter' };
    }

    if (username.length > 50) {
      return { valid: false, message: 'Username maksimal 50 karakter' };
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return {
        valid: false,
        message: 'Username hanya boleh mengandung huruf, angka, dan underscore',
      };
    }

    return { valid: true };
  }

  async validateUniqueEmail(
    email: string,
    currentUserId?: string,
  ): Promise<void> {
    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser && existingUser.id !== currentUserId) {
      throw new ConflictException(
        `Email "${email}" sudah digunakan oleh pengguna lain`,
      );
    }
  }
}
