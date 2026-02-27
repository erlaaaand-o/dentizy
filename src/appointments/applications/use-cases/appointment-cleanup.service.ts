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

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron(): Promise<void> {
    this.logger.log('🧹 Starting cleanup of past-due appointments...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const expiredResult = await this.appointmentRepository.update(
        {
          status: AppointmentStatus.DIJADWALKAN,
          tanggal_janji: LessThan(today),
        },
        {
          status: AppointmentStatus.DIBATALKAN,
        },
      );

      const expiredCount = expiredResult.affected ?? 0;

      if (expiredCount > 0) {
        this.logger.warn(
          `⚠️ ${expiredCount} appointment(s) berstatus DIJADWALKAN melewati tanggal jadwal, otomatis dibatalkan`,
        );
      }

      const pendingResult = await this.appointmentRepository.update(
        {
          status: AppointmentStatus.MENUNGGU_KONFIRMASI,
          tanggal_janji: LessThan(today),
        },
        {
          status: AppointmentStatus.DIBATALKAN,
        },
      );

      const pendingCount = pendingResult.affected ?? 0;

      if (pendingCount > 0) {
        this.logger.warn(
          `⚠️ ${pendingCount} appointment(s) berstatus MENUNGGU_KONFIRMASI melewati tanggal jadwal, otomatis dibatalkan`,
        );
      }

      const totalCleaned = expiredCount + pendingCount;

      this.logger.log(
        `✅ Cleanup selesai. Total ${totalCleaned} appointment(s) otomatis dibatalkan.`,
      );
    } catch (error) {
      this.logger.error(
        '❌ Error during appointment cleanup:',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async runCleanupManually(): Promise<{ cleaned: number }> {
    this.logger.log('🧹 Manual cleanup triggered...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiredResult = await this.appointmentRepository.update(
      {
        status: AppointmentStatus.DIJADWALKAN,
        tanggal_janji: LessThan(today),
      },
      {
        status: AppointmentStatus.DIBATALKAN,
      },
    );

    const pendingResult = await this.appointmentRepository.update(
      {
        status: AppointmentStatus.MENUNGGU_KONFIRMASI,
        tanggal_janji: LessThan(today),
      },
      {
        status: AppointmentStatus.DIBATALKAN,
      },
    );

    const totalCleaned =
      (expiredResult.affected ?? 0) + (pendingResult.affected ?? 0);

    this.logger.log(
      `✅ Manual cleanup selesai. Total ${totalCleaned} appointment(s) otomatis dibatalkan.`,
    );

    return { cleaned: totalCleaned };
  }
}
