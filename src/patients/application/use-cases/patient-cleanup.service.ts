import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Patient } from '../../domains/entities/patient.entity';

@Injectable()
export class PatientCleanupService {
  private readonly logger = new Logger(PatientCleanupService.name);

  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  /**
   * Cron Job: Hapus pasien online yang tidak aktif lebih dari 7 hari
   * Berjalan setiap hari jam 00:00
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    this.logger.log('🧹 Starting cleanup of unverified online patients...');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    try {
      // Hapus pasien yang:
      // 1. is_active = false
      // 2. is_registered_online = true
      // 3. created_at < 7 hari yang lalu
      // Note: TypeORM delete secara default tidak menghapus relation cascade kecuali disetting di entity.
      // Pastikan relasi appointment juga terhapus atau set NULL (tergantung FK constraint Anda).
      // Jika Anda pakai soft delete global, ini akan soft delete. Gunakan delete() untuk hard delete.

      const result = await this.patientRepository.delete({
        is_active: false,
        is_registered_online: true,
        created_at: LessThan(sevenDaysAgo),
      });

      if (result.affected && result.affected > 0) {
        this.logger.log(
          `✅ Cleaned up ${result.affected} unverified patients.`,
        );
      } else {
        this.logger.log('✨ No unverified patients to cleanup.');
      }
    } catch (error) {
      this.logger.error('❌ Error during patient cleanup cron:', error);
    }
  }
}
