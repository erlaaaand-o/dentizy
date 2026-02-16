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

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    this.logger.log('🧹 Starting cleanup of unverified online patients...');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    try {
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

      const softDeletedPatients = await this.patientRepository.find({
        withDeleted: true,
        where: { deleted_at: LessThan(new Date()) },
      });

      if (softDeletedPatients.length > 0) {
        await this.patientRepository.remove(softDeletedPatients);
        this.logger.log(
          `🗑 Permanently deleted ${softDeletedPatients.length} soft-deleted patients.`,
        );
      } else {
        this.logger.log('✨ No soft-deleted patients to cleanup.');
      }
    } catch (error) {
      this.logger.error('❌ Error during patient cleanup cron:', error);
    }
  }
}
