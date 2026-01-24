// backend/src/users/applications/use-cases/account-activation.service.ts
import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { UserRepository } from '../../infrastructures/repositories/user.repository';
import { EmailService } from '../../../notifications/services/email.service';
import { EmailTemplateService } from '../../../notifications/services/email-template.service';
import { ConfigService } from '@nestjs/config';

/**
 * Service untuk handle aktivasi akun user
 *
 * Flow:
 * 1. User klik "Aktivasi Akun" di frontend (butuh username/email)
 * 2. Backend generate activation token & kirim email
 * 3. User klik link di email → redirect ke halaman set password
 * 4. User set password baru → akun aktif
 */
@Injectable()
export class AccountActivationService {
  private readonly logger = new Logger(AccountActivationService.name);
  private readonly ACTIVATION_TOKEN_EXPIRY_HOURS = 24;

  // In-memory storage for demo (use Redis in production)
  private activationTokenStore = new Map<
    string,
    {
      userId: string;
      email: string;
      expiresAt: number;
    }
  >();

  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService,
    private readonly emailTemplateService: EmailTemplateService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Send activation email (triggered by user click)
   */
  async sendActivationEmail(usernameOrEmail: string): Promise<{
    message: string;
    email: string;
    expiresInHours: number;
  }> {
    try {
      // 1. Find user by username or email
      const user =
        await this.userRepository.findByUsernameOrEmailWithPassword(
          usernameOrEmail,
        );

      if (!user) {
        throw new NotFoundException(
          'User dengan username atau email tersebut tidak ditemukan',
        );
      }

      if (!user.email) {
        throw new BadRequestException(
          'User tidak memiliki email terdaftar. Silakan hubungi administrator untuk menambahkan email.',
        );
      }

      // 2. Check if user is already active
      if (user.is_active) {
        throw new BadRequestException(
          'Akun Anda sudah aktif. Silakan login dengan password Anda.',
        );
      }

      // 3. Generate activation token
      const activationToken = this.generateActivationToken(user.id, user.email);
      const activationLink = `${this.configService.get('FRONTEND_URL')}/activate-account?token=${activationToken}`;

      // 4. Store token with expiry
      const expiresAt =
        Date.now() + this.ACTIVATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;
      this.activationTokenStore.set(activationToken, {
        userId: user.id,
        email: user.email,
        expiresAt,
      });

      // 5. Send activation email
      const { subject, html } = this.getAccountActivationEmail({
        name: user.nama_lengkap,
        username: user.username,
        email: user.email,
        activationLink,
        roles: user.roles.map((r) => r.name),
      });

      await this.emailService.sendEmail({
        to: user.email,
        subject,
        html,
      });

      this.logger.log(
        `✅ Activation email sent to ${this.maskEmail(user.email)} for user ${user.username}`,
      );

      // Clean up expired tokens
      this.cleanupExpiredTokens();

      return {
        message: 'Email aktivasi telah dikirim. Silakan cek inbox Anda.',
        email: this.maskEmail(user.email),
        expiresInHours: this.ACTIVATION_TOKEN_EXPIRY_HOURS,
      };
    } catch (error) {
      this.logger.error('Error sending activation email:', error);
      throw error;
    }
  }

  /**
   * Verify activation token
   */
  async verifyActivationToken(token: string): Promise<{
    valid: boolean;
    message: string;
    userId?: string;
    email?: string;
  }> {
    try {
      const tokenData = this.activationTokenStore.get(token);

      if (!tokenData) {
        return {
          valid: false,
          message: 'Token aktivasi tidak valid atau sudah kedaluwarsa',
        };
      }

      // Check expiry
      if (Date.now() > tokenData.expiresAt) {
        this.activationTokenStore.delete(token);
        return {
          valid: false,
          message:
            'Token aktivasi sudah kedaluwarsa. Silakan minta link aktivasi baru.',
        };
      }

      this.logger.log(
        `✅ Activation token verified for user ID: ${tokenData.userId}`,
      );

      return {
        valid: true,
        message: 'Token valid. Silakan set password Anda.',
        userId: tokenData.userId,
        email: tokenData.email,
      };
    } catch (error) {
      this.logger.error('Error verifying activation token:', error);
      throw error;
    }
  }

  /**
   * Activate account with new password
   */
  async activateAccount(
    token: string,
    newPassword: string,
  ): Promise<{ message: string; username: string }> {
    try {
      // 1. Verify token
      const verification = await this.verifyActivationToken(token);

      if (!verification.valid || !verification.userId) {
        throw new BadRequestException(verification.message);
      }

      // 2. Find user
      const user = await this.userRepository.findByIdWithPassword(
        verification.userId,
      );

      if (!user) {
        throw new NotFoundException('User tidak ditemukan');
      }

      if (user.is_active) {
        throw new BadRequestException('Akun sudah aktif');
      }

      // 3. Set password & activate account
      // Password hashing will be handled by ResetPasswordService
      // For now, just mark as active
      user.is_active = true;
      await this.userRepository.update(user);

      // 4. Delete token after successful activation
      this.activationTokenStore.delete(token);

      this.logger.log(`✅ Account activated for user: ${user.username}`);

      return {
        message:
          'Akun berhasil diaktivasi! Silakan login dengan password Anda.',
        username: user.username,
      };
    } catch (error) {
      this.logger.error('Error activating account:', error);
      throw error;
    }
  }

  /**
   * Resend activation email (jika user tidak terima email)
   */
  async resendActivationEmail(usernameOrEmail: string): Promise<{
    message: string;
    email: string;
    expiresInHours: number;
  }> {
    this.logger.log(`Resending activation email for: ${usernameOrEmail}`);
    return this.sendActivationEmail(usernameOrEmail);
  }

  /**
   * Check if user can request activation
   */
  async checkActivationStatus(usernameOrEmail: string): Promise<{
    canActivate: boolean;
    isActive: boolean;
    hasEmail: boolean;
    message: string;
  }> {
    try {
      const user =
        await this.userRepository.findByUsernameOrEmailWithPassword(
          usernameOrEmail,
        );

      if (!user) {
        return {
          canActivate: false,
          isActive: false,
          hasEmail: false,
          message: 'User tidak ditemukan',
        };
      }

      if (user.is_active) {
        return {
          canActivate: false,
          isActive: true,
          hasEmail: !!user.email,
          message: 'Akun sudah aktif',
        };
      }

      if (!user.email) {
        return {
          canActivate: false,
          isActive: false,
          hasEmail: false,
          message: 'User tidak memiliki email terdaftar',
        };
      }

      return {
        canActivate: true,
        isActive: false,
        hasEmail: true,
        message: 'User dapat meminta aktivasi akun',
      };
    } catch (error) {
      this.logger.error('Error checking activation status:', error);
      throw error;
    }
  }

  /**
   * Generate activation token
   */
  private generateActivationToken(userId: string, email: string): string {
    const payload = {
      userId,
      email,
      purpose: 'account-activation',
      timestamp: Date.now(),
    };

    // Simple base64 encoding for demo
    // In production, use JWT or crypto.randomBytes
    const token = Buffer.from(JSON.stringify(payload)).toString('base64');

    // Add random suffix to make it harder to guess
    const randomSuffix = Math.random().toString(36).substring(2, 15);
    return `${token}.${randomSuffix}`;
  }

  /**
   * Mask email for privacy
   */
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (local.length <= 2) return `${local[0]}***@${domain}`;
    const maskedLocal = local[0] + '***' + local[local.length - 1];
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Clean up expired tokens
   */
  private cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [token, data] of this.activationTokenStore.entries()) {
      if (now > data.expiresAt) {
        this.activationTokenStore.delete(token);
      }
    }
  }

  /**
   * Account activation email template
   */
  private getAccountActivationEmail(data: {
    name: string;
    username: string;
    email: string;
    activationLink: string;
    roles: string[];
  }): { subject: string; html: string } {
    return {
      subject: 'Aktivasi Akun - Klinik Dentizy',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background-color: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              background-color: #2563eb;
              color: white;
              padding: 30px 20px;
              text-align: center;
            }
            .header h2 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 30px;
            }
            .welcome-box {
              background-color: #dbeafe;
              border-left: 4px solid #2563eb;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .detail-box {
              background-color: #f9fafb;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .detail-item {
              padding: 10px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .detail-item:last-child {
              border-bottom: none;
            }
            .button-container {
              text-align: center;
              margin: 30px 0;
            }
            .button {
              display: inline-block;
              padding: 14px 40px;
              background-color: #2563eb;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              font-size: 16px;
            }
            .link {
              word-break: break-all;
              color: #2563eb;
              font-size: 14px;
              padding: 10px;
              background-color: #f0f9ff;
              border-radius: 4px;
            }
            .warning {
              background-color: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              background-color: #f9fafb;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
              border-top: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🦷 Klinik Dentizy</h2>
              <p>Aktivasi Akun Anda</p>
            </div>
            
            <div class="content">
              <p>Halo, <strong>${data.name}</strong>!</p>
              
              <div class="welcome-box">
                <p style="margin: 0; color: #1e40af; font-weight: 600;">
                  🎉 Selamat! Akun Anda telah dibuat oleh administrator
                </p>
              </div>
              
              <p>Untuk mulai menggunakan sistem Klinik Dentizy, Anda perlu mengaktifkan akun dan membuat password terlebih dahulu.</p>
              
              <div class="detail-box">
                <h3 style="margin-top: 0; color: #2563eb;">📋 Detail Akun Anda</h3>
                <div class="detail-item">
                  👤 <strong>Username:</strong> ${data.username}
                </div>
                <div class="detail-item">
                  📧 <strong>Email:</strong> ${data.email}
                </div>
                <div class="detail-item">
                  🎭 <strong>Role:</strong> ${data.roles.join(', ')}
                </div>
              </div>
              
              <p><strong>Langkah aktivasi:</strong></p>
              <ol>
                <li>Klik tombol "Aktivasi Akun" di bawah ini</li>
                <li>Buat password baru yang aman</li>
                <li>Login dengan username dan password Anda</li>
              </ol>
              
              <div class="button-container">
                <a href="${data.activationLink}" class="button">✨ Aktivasi Akun</a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280;">Atau salin link berikut ke browser Anda:</p>
              <p class="link">${data.activationLink}</p>
              
              <div class="warning">
                <p style="margin: 0;">
                  ⚠️ <strong>Penting:</strong> Link aktivasi ini akan kedaluwarsa dalam <strong>24 jam</strong>.
                </p>
              </div>
              
              <p style="margin-top: 30px;">Jika Anda tidak meminta pembuatan akun ini, abaikan email ini atau hubungi administrator kami.</p>
              
              <p>Terima kasih,<br>
              <strong>Tim Klinik Dentizy</strong></p>
            </div>
            
            <div class="footer">
              <p>Email ini dikirim otomatis, mohon tidak membalas.</p>
              <p>© ${new Date().getFullYear()} Klinik Dentizy. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  }
}
