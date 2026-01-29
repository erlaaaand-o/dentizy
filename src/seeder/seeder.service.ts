import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { Role, UserRole } from '../roles/entities/role.entity';
import { User } from '../users/domains/entities/user.entity';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async seed() {
    this.logger.log('📦 Memulai proses seeding database...');

    try {
      await this.seedRoles();

      await this.seedUsers();

      this.logger.log('✅ Seeding completed successfully');
    } catch (error) {
      this.logger.error('❌ Seeding failed:', error);
      throw error;
    }
  }

  private async seedRoles() {
    try {
      const existingRoles = await this.roleRepo.find();

      if (existingRoles.length > 0) {
        this.logger.log('⏭️  Roles already exist, skipping...');
        return;
      }

      this.logger.log('📝 Seeding roles...');

      const roles = [
        { name: UserRole.DOKTER, description: 'Akses untuk dokter gigi' },
        { name: UserRole.STAF, description: 'Akses untuk staf administrasi' },
        {
          name: UserRole.KEPALA_KLINIK,
          description: 'Akses penuh untuk kepala klinik',
        },
      ];

      await this.roleRepo.save(roles);
      this.logger.log('✅ Roles seeded successfully');
    } catch (error) {
      this.logger.error('❌ Error seeding roles:', error);
      throw error;
    }
  }

  private async seedUsers() {
    try {
      const existingUsers = await this.userRepo.find();

      if (existingUsers.length > 0) {
        this.logger.log('⏭️  Users already exist, skipping...');
        return;
      }

      this.logger.log('👥 Seeding Kepala Klinik user...');

      const kepalaKlinikRole = await this.roleRepo.findOneBy({
        name: UserRole.KEPALA_KLINIK,
      });

      if (!kepalaKlinikRole) {
        throw new Error(
          'Role Kepala Klinik not found. Please run role seeding first.',
        );
      }

      const hashedPassword = await bcrypt.hash('developerganteng', 10);

      const user = {
        nama_lengkap: 'Siti Rahma',
        username: 'siti_kepala',
        email: 'mockemail3@gmail.com',
        password: hashedPassword,
        roles: [kepalaKlinikRole],
      };

      await this.userRepo.save(user);
      this.logger.log('✅ Kepala Klinik user seeded successfully');
    } catch (error) {
      this.logger.error('❌ Error seeding Kepala Klinik user:', error);
      throw error;
    }
  }
}
