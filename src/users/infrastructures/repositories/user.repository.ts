// infrastructure/repositories/user.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, SelectQueryBuilder } from 'typeorm';

import { User } from '../../domains/entities/user.entity';
import { Role } from '../../../roles/entities/role.entity';
import { UserRole } from '../../../roles/entities/role.entity';

interface CreateUserData {
  username: string;
  nama_lengkap: string;
  password: string;
  roles: Role[];
  email?: string | null;
}

interface FindUsersParams {
  skip: number;
  take: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
}

interface UserStatistics {
  total: number;
  byRole: Record<string, number>;
  active: number;
  inactive: number;
}

interface RoleStatRaw {
  roleName: string;
  count: string;
}

@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async create(data: CreateUserData): Promise<User> {
    const user = this.repository.create({
      username: data.username,
      nama_lengkap: data.nama_lengkap,
      password: data.password,
      roles: data.roles,
      email: data.email,
      is_active: false,
    });

    return this.repository.save(user);
  }

  async update(user: User): Promise<User> {
    return this.repository.save(user);
  }

  async delete(user: User): Promise<void> {
    await this.repository.remove(user);
  }

  async findAndCountUsers(params: FindUsersParams): Promise<[User[], number]> {
    const qb: SelectQueryBuilder<User> =
      this.repository.createQueryBuilder('user');

    qb.leftJoinAndSelect('user.roles', 'role');

    qb.select([
      'user.id',
      'user.username',
      'user.nama_lengkap',
      'user.email',
      'user.created_at',
      'user.updated_at',
      'user.profile_photo',
      'user.is_active',
      'role.id',
      'role.name',
      'role.description',
    ]);

    if (params.search) {
      qb.andWhere(
        '(LOWER(user.nama_lengkap) LIKE LOWER(:search) OR LOWER(user.username) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search))',
        { search: `%${params.search}%` },
      );
    }

    if (params.role) {
      qb.andWhere('role.name = :roleName', { roleName: params.role });
    }

    if (params.isActive !== undefined) {
      qb.andWhere('user.is_active = :isActive', { isActive: params.isActive });
    }

    qb.orderBy('user.created_at', 'DESC').skip(params.skip).take(params.take);

    return qb.getManyAndCount();
  }

  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['roles'],
      select: [
        'id',
        'username',
        'nama_lengkap',
        'email',
        'created_at',
        'updated_at',
        'profile_photo',
        'is_active',
      ],
    });
  }

  async findByIdWithPassword(id: string): Promise<User | null> {
    return this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .where('user.id = :id', { id })
      .addSelect('user.password')
      .getOne();
  }

  async findByUsernameWithoutPassword(username: string): Promise<User | null> {
    return this.repository.findOne({
      where: { username },
      select: ['id', 'username'],
    });
  }

  async findByUsernameOrEmailWithPassword(
    identifier: string,
  ): Promise<User | null> {
    return this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .addSelect('user.password')
      .where('user.username = :identifier OR user.email = :identifier', {
        identifier,
      })
      .getOne();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({
      where: { email },
    });
  }

  async usernameExists(username: string): Promise<boolean> {
    const count = await this.repository.count({ where: { username } });
    return count > 0;
  }

  async findRolesByIds(roleIds: string[]): Promise<Role[]> {
    if (roleIds.length === 0) return [];
    return this.roleRepository.find({
      where: { id: In(roleIds) },
    });
  }

  async findRecentlyCreated(limit: number): Promise<User[]> {
    return this.repository.find({
      order: { created_at: 'DESC' },
      take: limit,
      relations: ['roles'],
      select: [
        'id',
        'username',
        'nama_lengkap',
        'email',
        'created_at',
        'updated_at',
        'profile_photo',
        'is_active',
      ],
    });
  }

  async getStatistics(): Promise<UserStatistics> {
    const total = await this.repository.count();
    const active = await this.repository.count({ where: { is_active: true } });
    const inactive = await this.repository.count({
      where: { is_active: false },
    });

    const roleStats = await this.repository
      .createQueryBuilder('user')
      .leftJoin('user.roles', 'role')
      .select('role.name', 'roleName')
      .addSelect('COUNT(DISTINCT user.id)', 'count')
      .groupBy('role.name')
      .getRawMany<RoleStatRaw>();

    const byRole: Record<string, number> = {};
    roleStats.forEach((stat) => {
      if (stat.roleName) {
        byRole[stat.roleName] = parseInt(stat.count, 10);
      }
    });

    return { total, active, inactive, byRole };
  }
}
