import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly maxRetries = 3;
  private readonly retryDelays = [1000, 2000, 5000];

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Send email with retry mechanism
   */
  async sendEmail(data: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        await this.mailerService.sendMail({
          to: data.to,
          subject: data.subject,
          html: data.html,
        });

        this.logger.log(`✅ Email sent to ${data.to}: ${data.subject}`);
        return;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `⚠️ Email send attempt ${attempt + 1}/${this.maxRetries} failed: ${lastError.message}`,
        );

        if (attempt < this.maxRetries - 1) {
          await this.delay(this.retryDelays[attempt]);
        }
      }
    }

    this.logger.error(
      `❌ Failed to send email to ${data.to} after ${this.maxRetries} attempts`,
    );
    throw new Error(
      `Failed to send email after ${this.maxRetries} attempts: ${lastError?.message}`,
    );
  }

  /**
   * Send multiple emails (batch)
   */
  async sendBatch(
    emails: Array<{ to: string; subject: string; html: string }>,
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const email of emails) {
      try {
        await this.sendEmail(email);
        sent++;
      } catch (error) {
        failed++;
      }
    }

    this.logger.log(`📊 Batch email: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
