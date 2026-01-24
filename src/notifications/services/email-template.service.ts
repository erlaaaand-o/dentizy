import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OTPEmailData,
  PasswordResetEmailData,
  AppointmentReminderEmailData,
  PaymentEmailData,
} from '../types/email.types';

@Injectable()
export class EmailTemplateService {
  private readonly appName: string;
  private readonly appUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.appName = this.configService.get('APP_NAME', 'Klinik Dentizy');
    this.appUrl = this.configService.get('APP_URL', 'http://localhost:3000');
  }

  getOTPEmail(data: OTPEmailData): { subject: string; html: string } {
    return {
      subject: `Kode OTP Anda - ${this.appName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>${this.getBaseStyles()}</style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🦷 ${this.appName}</h2>
              <p>Verifikasi Akun Anda</p>
            </div>

            <div class="content">
              <p>Halo, <strong>${data.name}</strong>!</p>

              <p>Gunakan kode OTP berikut untuk verifikasi:</p>

              <div class="otp-box">
                ${data.otpCode}
              </div>

              <p class="warning">
                ⚠️ Kode ini akan kedaluwarsa dalam <strong>${data.expiresInMinutes} menit</strong>.
              </p>

              <p>Jika Anda tidak meminta kode ini, abaikan email ini.</p>
            </div>

            ${this.getFooter()}
          </div>
        </body>
        </html>
      `,
    };
  }

  getPasswordResetEmail(data: PasswordResetEmailData): {
    subject: string;
    html: string;
  } {
    return {
      subject: `Reset Password - ${this.appName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>${this.getBaseStyles()}</style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🦷 ${this.appName}</h2>
              <p>Reset Password</p>
            </div>

            <div class="content">
              <p>Halo, <strong>${data.name}</strong>!</p>

              <p>Kami menerima permintaan untuk mereset password Anda.</p>

              <div class="button-container">
                <a href="${data.resetLink}" class="button">Reset Password</a>
              </div>

              <p>Atau salin link berikut ke browser Anda:</p>
              <p class="link">${data.resetLink}</p>

              <p class="warning">
                ⚠️ Link ini akan kedaluwarsa dalam <strong>${data.expiresInMinutes} menit</strong>.
              </p>

              <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
            </div>

            ${this.getFooter()}
          </div>
        </body>
        </html>
      `,
    };
  }

  getPasswordChangedEmail(data: { name: string }): {
    subject: string;
    html: string;
  } {
    return {
      subject: `Password Berhasil Diubah - ${this.appName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>${this.getBaseStyles()}</style>
        </head>
        <body>
          <div class="container">
            <div class="header-success">
              <h2>🦷 ${this.appName}</h2>
              <p>Password Berhasil Diubah</p>
            </div>

            <div class="content">
              <p>Halo, <strong>${data.name}</strong>!</p>

              <div class="success-box">
                <p>✅ Password Anda telah berhasil diubah.</p>
              </div>

              <p>Jika Anda tidak melakukan perubahan ini, segera hubungi kami.</p>
            </div>

            ${this.getFooter()}
          </div>
        </body>
        </html>
      `,
    };
  }

  getAppointmentReminderEmail(data: AppointmentReminderEmailData): {
    subject: string;
    html: string;
  } {
    return {
      subject: `Pengingat Janji Temu Besok - ${this.appName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>${this.getBaseStyles()}</style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🦷 ${this.appName}</h2>
              <p>Pengingat Janji Temu</p>
            </div>

            <div class="content">
              <p>Halo, <strong>${data.patientName}</strong>!</p>

              <p>Ini pengingat untuk janji temu Anda <strong>besok</strong>:</p>

              <div class="detail-box">
                <div class="detail-item">📅 <strong>Tanggal:</strong> ${data.appointmentDate}</div>
                <div class="detail-item">🕐 <strong>Jam:</strong> ${data.appointmentTime}</div>
                <div class="detail-item">👨‍⚕️ <strong>Dokter:</strong> ${data.doctorName}</div>
                ${
                  data.complaint
                    ? `<div class="detail-item">📝 <strong>Keluhan:</strong> ${data.complaint}</div>`
                    : ''
                }
              </div>

              <p class="warning">
                ⚠️ Jika tidak bisa hadir, mohon hubungi klinik untuk reschedule.
              </p>
            </div>

            ${this.getFooter()}
          </div>
        </body>
        </html>
      `,
    };
  }

  getPaymentConfirmedEmail(data: PaymentEmailData): {
    subject: string;
    html: string;
  } {
    const amount = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(data.amount);

    return {
      subject: `Pembayaran Berhasil - ${data.invoiceNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>${this.getBaseStyles()}</style>
        </head>
        <body>
          <div class="container">
            <div class="header-success">
              <h2>🦷 ${this.appName}</h2>
              <p>Pembayaran Berhasil</p>
            </div>

            <div class="content">
              <p>Halo, <strong>${data.patientName}</strong>!</p>

              <div class="success-box">
                <p>✅ Pembayaran Anda telah berhasil dikonfirmasi!</p>
              </div>

              <div class="detail-box">
                <div class="detail-item">🔢 <strong>Invoice:</strong> ${data.invoiceNumber}</div>
                <div class="detail-item">💳 <strong>Metode:</strong> ${data.paymentMethod || '-'}</div>
              </div>

              <div class="amount-box">
                ${amount}
              </div>

              <p>Terima kasih atas pembayaran Anda!</p>
            </div>

            ${this.getFooter()}
          </div>
        </body>
        </html>
      `,
    };
  }

  getPaymentCancelledEmail(data: PaymentEmailData): {
    subject: string;
    html: string;
  } {
    const amount = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(data.amount);

    return {
      subject: `Pembayaran Dibatalkan - ${data.invoiceNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>${this.getBaseStyles()}</style>
        </head>
        <body>
          <div class="container">
            <div class="header-danger">
              <h2>🦷 ${this.appName}</h2>
              <p>Pembayaran Dibatalkan</p>
            </div>

            <div class="content">
              <p>Halo, <strong>${data.patientName}</strong>!</p>

              <div class="danger-box">
                <p>❌ Pembayaran Anda telah dibatalkan</p>
              </div>

              <div class="detail-box">
                <div class="detail-item">🔢 <strong>Invoice:</strong> ${data.invoiceNumber}</div>
                ${
                  data.reason
                    ? `<div class="detail-item">📝 <strong>Alasan:</strong> ${data.reason}</div>`
                    : ''
                }
              </div>

              <div class="amount-box-danger">
                ${amount}
              </div>

              <p>Anda dapat membuat pembayaran baru jika diperlukan.</p>
            </div>

            ${this.getFooter()}
          </div>
        </body>
        </html>
      `,
    };
  }

  private getBaseStyles(): string {
    return `
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
      .header-success {
        background-color: #16a34a;
        color: white;
        padding: 30px 20px;
        text-align: center;
      }
      .header-danger {
        background-color: #dc2626;
        color: white;
        padding: 30px 20px;
        text-align: center;
      }
      .header h2, .header-success h2, .header-danger h2 {
        margin: 0;
        font-size: 24px;
      }
      .header p, .header-success p, .header-danger p {
        margin: 10px 0 0 0;
        opacity: 0.9;
      }
      .content {
        padding: 30px;
      }
      .otp-box {
        background-color: #f0f9ff;
        border: 2px dashed #2563eb;
        padding: 20px;
        text-align: center;
        font-size: 32px;
        font-weight: bold;
        letter-spacing: 8px;
        color: #2563eb;
        margin: 20px 0;
        border-radius: 8px;
      }
      .success-box {
        background-color: #dcfce7;
        border-left: 4px solid #16a34a;
        padding: 15px;
        margin: 20px 0;
        border-radius: 4px;
      }
      .success-box p {
        margin: 0;
        color: #16a34a;
        font-weight: 600;
      }
      .danger-box {
        background-color: #fef2f2;
        border-left: 4px solid #dc2626;
        padding: 15px;
        margin: 20px 0;
        border-radius: 4px;
      }
      .danger-box p {
        margin: 0;
        color: #dc2626;
        font-weight: 600;
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
      .amount-box {
        background-color: #dcfce7;
        padding: 20px;
        text-align: center;
        font-size: 28px;
        font-weight: bold;
        color: #16a34a;
        margin: 20px 0;
        border-radius: 8px;
      }
      .amount-box-danger {
        background-color: #fef2f2;
        padding: 20px;
        text-align: center;
        font-size: 28px;
        font-weight: bold;
        color: #dc2626;
        margin: 20px 0;
        border-radius: 8px;
      }
      .button-container {
        text-align: center;
        margin: 30px 0;
      }
      .button {
        display: inline-block;
        padding: 12px 30px;
        background-color: #2563eb;
        color: white;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 600;
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
      .warning p {
        margin: 0;
        color: #92400e;
      }
      .footer {
        background-color: #f9fafb;
        padding: 20px;
        text-align: center;
        font-size: 12px;
        color: #6b7280;
        border-top: 1px solid #e5e7eb;
      }
      .footer p {
        margin: 5px 0;
      }
    `;
  }

  private getFooter(): string {
    return `
      <div class="footer">
        <p>Email ini dikirim otomatis, mohon tidak membalas.</p>
        <p>© ${new Date().getFullYear()} ${this.appName}. All rights reserved.</p>
      </div>
    `;
  }
}
