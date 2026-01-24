// backend/src/users/infrastructures/listeners/password-changed.listener.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { EmailTemplateService } from '../../../notifications/services/email-template.service';
import { EmailService } from '../../../notifications/services/email.service';
import { PasswordChangedEvent } from '../events/password-changed.event';
import { UserRepository } from '../repositories/user.repository';

/**
 * Listener untuk event password.changed
 * Mengirim email konfirmasi setelah password berhasil diubah
 */
@Injectable()
export class PasswordChangedListener {
  private readonly logger = new Logger(PasswordChangedListener.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly emailTemplateService: EmailTemplateService,
    private readonly userRepository: UserRepository,
  ) {}

  @OnEvent('password.changed')
  async handlePasswordChanged(event: PasswordChangedEvent) {
    this.logger.log(
      `📧 Processing password.changed event for: ${event.username} (ID: ${event.userId})`,
    );

    try {
      // 1. Get user with email
      const user = await this.userRepository.findById(event.userId);

      if (!user || !user.email) {
        this.logger.warn(
          `⚠️ User ${event.username} has no email, skipping password change notification`,
        );
        return;
      }

      // 2. Send confirmation email
      const { subject, html } =
        this.emailTemplateService.getPasswordChangedEmail({
          name: user.nama_lengkap,
        });

      await this.emailService.sendEmail({
        to: user.email,
        subject,
        html,
      });

      this.logger.log(
        `✅ Password change confirmation sent to ${user.email} for user ${event.username}`,
      );

      // 3. Optional: Log security event if changed by admin
      if (event.isAdminReset()) {
        this.logger.warn(
          `🔒 Password was reset by admin for user ${event.username}`,
        );
        // TODO: You might want to send a different email or log this to security audit
      }
    } catch (error) {
      // Don't throw - we don't want to break the password change process
      this.logger.error(
        `❌ Failed to send password change confirmation for user ${event.username}:`,
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }
}
