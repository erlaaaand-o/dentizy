import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';

import {
  Appointment,
  AppointmentStatus,
} from '../../domains/entities/appointment.entity';

@Injectable()
export class AppointmentCleanupService {
  private readonly logger = new Logger(AppointmentCleanupService.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
  ) {}

  /**
   * Jalankan setiap tengah malam untuk membersihkan appointment lama
   * yang sudah lebih dari 7 hari dan masih berstatus DIJADWALKAN
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron(): Promise<void> {
    this.logger.log('🧹 Starting cleanup of old appointments...');

    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      // Tandai appointment lama yang masih DIJADWALKAN sebagai DIBATALKAN
      const expiredResult = await this.appointmentRepository.update(
        {
          status: AppointmentStatus.DIJADWALKAN,
          tanggal_janji: LessThan(sevenDaysAgo),
        },
        {
          status: AppointmentStatus.DIBATALKAN,
        },
      );

      const expiredCount = expiredResult.affected ?? 0;

      if (expiredCount > 0) {
        this.logger.warn(
          `⚠️ ${expiredCount} appointment(s) lewat 7 hari otomatis dibatalkan`,
        );
      }

      // Tandai appointment yang menunggu konfirmasi lebih dari 7 hari sebagai DIBATALKAN
      const pendingResult = await this.appointmentRepository.update(
        {
          status: AppointmentStatus.MENUNGGU_KONFIRMASI,
          tanggal_janji: LessThan(sevenDaysAgo),
        },
        {
          status: AppointmentStatus.DIBATALKAN,
        },
      );

      const pendingCount = pendingResult.affected ?? 0;

      if (pendingCount > 0) {
        this.logger.warn(
          `⚠️ ${pendingCount} appointment(s) menunggu konfirmasi lebih dari 7 hari otomatis dibatalkan`,
        );
      }

      const totalCleaned = expiredCount + pendingCount;

      this.logger.log(
        `✅ Cleanup selesai. Total ${totalCleaned} appointment(s) diproses.`,
      );
    } catch (error) {
      this.logger.error(
        '❌ Error during appointment cleanup:',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * Manual trigger untuk cleanup (bisa dipanggil oleh admin jika diperlukan)
   */
  async runCleanupManually(): Promise<{ cleaned: number }> {
    this.logger.log('🧹 Manual cleanup triggered...');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const expiredResult = await this.appointmentRepository.update(
      {
        status: AppointmentStatus.DIJADWALKAN,
        tanggal_janji: LessThan(sevenDaysAgo),
      },
      {
        status: AppointmentStatus.DIBATALKAN,
      },
    );

    const pendingResult = await this.appointmentRepository.update(
      {
        status: AppointmentStatus.MENUNGGU_KONFIRMASI,
        tanggal_janji: LessThan(sevenDaysAgo),
      },
      {
        status: AppointmentStatus.DIBATALKAN,
      },
    );

    const totalCleaned =
      (expiredResult.affected ?? 0) + (pendingResult.affected ?? 0);

    this.logger.log(`
      ✅ Manual cleanup selesai. Total ${totalCleaned} appointment(s) diproses.`);

    return { cleaned: totalCleaned };
  }
}
