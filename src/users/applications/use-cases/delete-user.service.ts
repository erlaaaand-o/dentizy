// application/use-cases/delete-user.service.ts
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { UserRepository } from '../../infrastructures/repositories/user.repository';
import { UserValidationService } from '../../domains/services/user-validation.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserDeletedEvent } from '../../infrastructures/events/user-deleted.event';

@Injectable()
export class DeleteUserService {
  private readonly logger = new Logger(DeleteUserService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly userValidation: UserValidationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(userId: string): Promise<{ message: string }> {
    try {
      // 1. Find user
      const user = await this.userRepository.findByIdWithPassword(userId);
      this.userValidation.validateUserExists(user, userId);

      if (!user) {
        throw new BadRequestException(`User with id ${userId} not found`);
      }

      // 2. Validate can delete
      const canDeleteCheck = this.userValidation.validateCanDelete(user);
      if (!canDeleteCheck.canDelete) {
        throw new BadRequestException(canDeleteCheck.reason);
      }

      // 3. Delete user
      await this.userRepository.delete(user);

      // 4. Emit event
      this.eventEmitter.emit(
        'user.deleted',
        new UserDeletedEvent(userId, user.username),
      );

      // 5. Log and return
      this.logger.log(`🗑️ User deleted: ${user.username} (ID: ${userId})`);
      return { message: `User ${user.username} berhasil dihapus` };
    } catch (error) {
      this.logger.error(`Error deleting user ID ${userId}:`, error.message);
      throw error;
    }
  }
}
