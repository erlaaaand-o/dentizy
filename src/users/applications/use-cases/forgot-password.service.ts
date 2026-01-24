// backend/src/users/applications/use-cases/forgot-password.service.ts

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import type { Cache } from 'cache-manager'; // ✅ FIX: Gunakan 'import type' untuk menghindari error TS1272

import { PasswordHasherService } from '../../../auth/infrastructures/security/password-hasher.service';
import { EmailTemplateService } from '../../../notifications/services/email-template.service';
import { EmailService } from '../../../notifications/services/email.service';
import { UserRepository } from '../../infrastructures/repositories/user.repository';

interface OtpCacheData {
  otp: string;
  attempts: number;
}

@Injectable()
export class ForgotPasswordService {
  private readonly logger = new Logger(ForgotPasswordService.name);
  private readonly OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 Menit (dalam milidetik)
  private readonly RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 Menit
  private readonly MAX_ATTEMPTS = 3;

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService,
    private readonly emailTemplateService: EmailTemplateService,
    private readonly passwordHasherService: PasswordHasherService, // ✅ Inject Hasher
  ) {}

  /**
   * 1. Send OTP to user's email
   */
  async sendOTP(emailOrUsername: string): Promise<{
    message: string;
    email: string;
    expiresInMinutes: number;
  }> {
    try {
      // Cari User
      const user =
        await this.userRepository.findByUsernameOrEmailWithPassword(
          emailOrUsername,
        );

      if (!user || !user.email) {
        // Security: Return fake success to prevent user enumeration
        // Atau throw error jika kebijakan membolehkan
        throw new NotFoundException(
          'User tidak ditemukan atau tidak memiliki email.',
        );
      }

      // Generate OTP
      const otp = this.generateOTP();

      // Simpan ke Cache (Redis)
      const cacheKey = `otp_reset:${user.email}`;
      const otpData: OtpCacheData = { otp, attempts: 0 };

      // Simpan dengan TTL (Time To Live)
      await this.cacheManager.set(cacheKey, otpData, this.OTP_EXPIRY_MS);

      // Siapkan Email
      const { subject, html } = this.emailTemplateService.getOTPEmail({
        to: user.email,
        name: user.nama_lengkap,
        otpCode: otp,
        expiresInMinutes: 5,
        subject: '',
      });

      // Kirim Email
      await this.emailService.sendEmail({
        to: user.email,
        subject,
        html,
      });

      this.logger.log(
        `✅ OTP sent to ${this.maskEmail(user.email)} for user ${user.username}`,
      );

      return {
        message: 'Kode OTP telah dikirim ke email Anda',
        email: this.maskEmail(user.email),
        expiresInMinutes: 5,
      };
    } catch (error) {
      this.logger.error('Error sending OTP:', error);
      throw error;
    }
  }

  /**
   * 2. Verify OTP and return Reset Token
   */
  async verifyOTP(
    email: string,
    inputOtp: string,
  ): Promise<{
    valid: boolean;
    message: string;
    resetToken?: string;
  }> {
    try {
      const cacheKey = `otp_reset:${email}`;
      const storedData = await this.cacheManager.get<OtpCacheData>(cacheKey);

      // Validasi: Apakah OTP ada / expired?
      if (!storedData) {
        throw new BadRequestException(
          'Kode OTP tidak valid atau sudah kedaluwarsa. Silakan minta kode baru.',
        );
      }

      // Validasi: Max Attempts
      if (storedData.attempts >= this.MAX_ATTEMPTS) {
        await this.cacheManager.del(cacheKey);
        throw new BadRequestException(
          'Terlalu banyak percobaan gagal. Silakan minta OTP baru.',
        );
      }

      // Validasi: Kode Cocok?
      if (storedData.otp !== inputOtp) {
        storedData.attempts += 1;
        await this.cacheManager.set(cacheKey, storedData, this.OTP_EXPIRY_MS);
        throw new BadRequestException(
          `Kode OTP salah. Sisa percobaan: ${this.MAX_ATTEMPTS - storedData.attempts}`,
        );
      }

      // SUKSES: Hapus OTP agar tidak bisa dipakai lagi
      await this.cacheManager.del(cacheKey);

      // Generate Reset Token (Temporary Token untuk tahap ubah password)
      const resetToken = this.generateResetToken(email);

      // Simpan Reset Token ke Cache
      const tokenKey = `reset_token:${resetToken}`;
      await this.cacheManager.set(tokenKey, email, this.RESET_TOKEN_EXPIRY_MS);

      this.logger.log(
        `✅ OTP verified successfully for ${this.maskEmail(email)}`,
      );

      return {
        valid: true,
        message: 'Kode OTP valid',
        resetToken,
      };
    } catch (error) {
      this.logger.error('Error verifying OTP:', error);
      throw error;
    }
  }

  /**
   * 3. Reset password using reset token (Method yang hilang sebelumnya)
   */
  async resetPasswordWithToken(
    resetToken: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    try {
      // Ambil email dari cache berdasarkan token
      const tokenKey = `reset_token:${resetToken}`;
      const email = await this.cacheManager.get<string>(tokenKey);

      if (!email) {
        throw new BadRequestException(
          'Sesi reset password tidak valid atau sudah berakhir. Silakan ulangi proses verifikasi OTP.',
        );
      }

      // Cari user
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new NotFoundException('User tidak ditemukan');
      }

      // Hash password baru
      const hashedPassword = await this.passwordHasherService.hash(newPassword);

      // Update password user
      user.password = hashedPassword;
      await this.userRepository.update(user);

      // Hapus token agar tidak bisa dipakai lagi (Single Use)
      await this.cacheManager.del(tokenKey);

      this.logger.log(
        `✅ Password reset successfully for ${this.maskEmail(email)}`,
      );

      return {
        message:
          'Password berhasil direset. Silakan login dengan password baru.',
      };
    } catch (error) {
      this.logger.error('Error resetting password with token:', error);
      throw error;
    }
  }

  // --- Helper Methods ---

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateResetToken(email: string): string {
    // Generate random string + timestamp base64
    const random = Math.random().toString(36).substring(2, 15);
    const payload = `${email}:${Date.now()}:${random}`;
    return Buffer.from(payload).toString('base64');
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (local.length <= 2) return `${local}***@${domain}`;
    const maskedLocal =
      local.charAt(0) + '***' + local.charAt(local.length - 1);
    return `${maskedLocal}@${domain}`;
  }
}
