// application/use-cases/find-users.service.ts

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { FindUsersQueryDto } from '../dto/find-users-query.dto';
import { UserRepository } from '../../infrastructures/repositories/user.repository';
import { UserMapper } from '../../domains/mappers/user.mapper';
import { UserResponseDto } from '../dto/user-response.dto';
import { User } from '../../domains/entities/user.entity';

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface UserListResponse {
  data: UserResponseDto[];
  meta: PaginationMeta;
}

interface UsernameAvailability {
  available: boolean;
  message: string;
}

interface UserStatistics {
  total: number;
  byRole: Record<string, number>;
  active: number;
  inactive: number;
}

@Injectable()
export class FindUsersService {
  private readonly logger = new Logger(FindUsersService.name);

  constructor(private readonly userRepository: UserRepository) {}

  async findAll(query: FindUsersQueryDto): Promise<UserListResponse> {
    try {
      this.logger.debug(`Finding users with query: ${JSON.stringify(query)}`);

      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;

      const [users, total] = await this.userRepository.findAndCountUsers({
        skip,
        take: limit,
        search: query.search,
        role: query.role,
        isActive: query.isActive,
      });

      this.logger.log(`📋 Retrieved ${users.length} users (Total: ${total})`);

      const lastPage = Math.ceil(total / limit);

      return {
        data: UserMapper.toResponseDtoArray(users),
        meta: {
          total,
          page,
          limit,
          lastPage,
          hasNext: page < lastPage,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      this.logger.error('Error fetching users:', error);
      throw new BadRequestException(
        'Gagal mengambil daftar users. Silakan coba lagi.',
      );
    }
  }

  async findOne(userId: string): Promise<UserResponseDto> {
    try {
      const user = await this.userRepository.findById(userId);

      if (!user) {
        throw new NotFoundException(
          `User dengan ID #${userId} tidak ditemukan`,
        );
      }

      return UserMapper.toResponseDto(user);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      this.logger.error(`Error finding user ID ${userId}:`, error);
      throw new InternalServerErrorException(
        'Terjadi kesalahan saat mengambil data user',
      );
    }
  }

  async findOneForAuth(userId: string): Promise<User> {
    try {
      const user = await this.userRepository.findByIdWithPassword(userId);

      if (!user) {
        throw new NotFoundException(
          `User dengan ID #${userId} tidak ditemukan`,
        );
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Error finding user for auth ID ${userId}:`, error);
      throw new InternalServerErrorException('Gagal memverifikasi user');
    }
  }

  async findByUsernameOrEmailForAuth(identifier: string): Promise<User> {
    const user =
      await this.userRepository.findByUsernameOrEmailWithPassword(identifier);

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    return user;
  }

  async checkUsernameAvailability(
    username: string,
  ): Promise<UsernameAvailability> {
    try {
      const exists = await this.userRepository.usernameExists(username);

      return {
        available: !exists,
        message: exists
          ? `Username "${username}" sudah digunakan`
          : `Username "${username}" tersedia`,
      };
    } catch (error) {
      this.logger.error('Error checking username availability:', error);
      throw new BadRequestException('Gagal memeriksa ketersediaan username');
    }
  }

  async getUserStatistics(): Promise<UserStatistics> {
    try {
      return await this.userRepository.getStatistics();
    } catch (error) {
      this.logger.error('Error getting user statistics:', error);
      throw new BadRequestException('Gagal mengambil statistik users');
    }
  }

  async getRecentlyCreated(limit: number = 10): Promise<UserResponseDto[]> {
    try {
      if (limit < 1 || limit > 50) {
        limit = 10;
      }

      const users = await this.userRepository.findRecentlyCreated(limit);
      return UserMapper.toResponseDtoArray(users);
    } catch (error) {
      this.logger.error('Error getting recently created users:', error);
      throw new BadRequestException('Gagal mengambil daftar user terbaru');
    }
  }
}
