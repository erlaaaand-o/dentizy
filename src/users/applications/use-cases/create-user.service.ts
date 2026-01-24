import { Injectable, Logger } from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserRepository } from '../../infrastructures/repositories/user.repository';
import { UserValidationService } from '../../domains/services/user-validation.service';
import { PasswordHasherService } from '../../../auth/infrastructures/security/password-hasher.service';
import { UserMapper } from '../../domains/mappers/user.mapper';
import { UserResponseDto } from '../dto/user-response.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserCreatedEvent } from '../../infrastructures/events/user-created.event';
import { Role } from '../../../roles/entities/role.entity';

// Interface payload tetap sama, karena Role[] adalah array object
interface CreateUserPayload {
  username: string;
  nama_lengkap: string;
  password: string;
  roles: Role[];
  email: string | null;
}

@Injectable()
export class CreateUserService {
  private readonly logger = new Logger(CreateUserService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly userValidation: UserValidationService,
    private readonly passwordHasher: PasswordHasherService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const {
      roles: roleIds, // [UUID Note]: Pastikan di DTO ini tipe datanya string[]
      password,
      username,
      nama_lengkap,
      email,
    } = createUserDto;

    try {
      // 1. Validasi Username (existingUser.id nanti string, tapi logic ini aman)
      const existingUser =
        await this.userRepository.findByUsernameWithoutPassword(username);
      this.userValidation.validateUsernameUniqueness(existingUser, username);

      // 2. Validasi Email
      if (email) {
        await this.userValidation.validateUniqueEmail(email);
      }

      // 3. Validasi Roles (Bagian Kritis Migrasi UUID)
      // [UUID Update]: Pastikan method findRolesByIds di repo menerima string[]
      const roles = await this.userRepository.findRolesByIds(roleIds);

      // [UUID Update]: Pastikan method validateRolesExist menerima (string[], Role[])
      this.userValidation.validateRolesExist(roleIds, roles);

      const hashedPassword = await this.passwordHasher.hash(password);

      const payload: CreateUserPayload = {
        username,
        nama_lengkap,
        password: hashedPassword,
        roles,
        email: email || null,
      };

      // 4. Create User
      // newUser.id sekarang adalah string (UUID)
      const newUser = await this.userRepository.create(payload);

      // 5. Emit Event
      this.eventEmitter.emit(
        'user.created',
        new UserCreatedEvent(
          newUser.id, // [UUID Update]: Parameter pertama harus string
          newUser.username,
          newUser.nama_lengkap,
          newUser.roles.map((r) => r.name),
        ),
      );

      this.logger.log(
        `✅ User created: ${newUser.username} (ID: ${newUser.id})`,
      );

      // Pastikan Mapper juga sudah disesuaikan untuk menerima UUID
      return UserMapper.toResponseDto(newUser);
    } catch (error) {
      this.logger.error(
        'Error creating user:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      throw error;
    }
  }
}
