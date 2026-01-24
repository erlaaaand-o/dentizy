import { BadRequestException, Injectable } from '@nestjs/common';

/**
 * Validator untuk waktu appointment (tanggal & jam)
 */
@Injectable()
export class AppointmentTimeValidator {
  private readonly WORKING_HOURS_START = 8; // 08:00
  private readonly WORKING_HOURS_END = 17; // 17:00
  private readonly LAST_APPOINTMENT_HOUR = 16; // 16:xx
  private readonly LAST_APPOINTMENT_MINUTE = 30; // xx:30

  /**
   * Validasi tanggal tidak boleh di masa lalu
   */
  validateDateNotInPast(tanggalJanji: Date) {
    // 1. Buat tanggal 'today' dan setel ke tengah malam
    const today = new Date();
    today.setHours(0, 0, 0, 0); // <-- Kunci perbaikan

    // 2. Buat salinan tanggal janji temu dan setel ke tengah malam
    //    (Penting untuk membuat salinan agar tidak mengubah data aslinya)
    const appointmentDateOnly = new Date(tanggalJanji.getTime());
    appointmentDateOnly.setHours(0, 0, 0, 0); // <-- Kunci perbaikan

    // 3. Sekarang perbandingan akan adil (hanya membandingkan tanggal)
    if (appointmentDateOnly < today) {
      throw new BadRequestException(
        'Tanggal janji temu tidak boleh di masa lalu',
      );
    }
  }

  /**
   * Validasi jam kerja klinik (08:00 - 16:30)
   */
  validateWorkingHours(jamJanji: string): void {
    // 1. Baca jam, menit, dan DETIK. Beri default 0 jika detik tidak ada.
    const [hours, minutes, seconds = 0] = jamJanji.split(':').map(Number);

    // Cek kondisi jam di luar jam buka (sebelum 08:00 atau setelah/sama dengan 17:00)
    const isBeforeStart = hours < this.WORKING_HOURS_START;
    const isAfterEnd = hours >= this.WORKING_HOURS_END;

    // Cek kondisi jam setelah waktu janji terakhir (16:30:00)
    const isAfterLastAppointment =
      // Kasus 1: Jam 16, menit di atas 30 (misal 16:31:00)
      (hours === this.LAST_APPOINTMENT_HOUR &&
        minutes > this.LAST_APPOINTMENT_MINUTE) ||
      // Kasus 2: Jam 16, menit 30, TAPI detik di atas 0 (misal 16:30:01)
      (hours === this.LAST_APPOINTMENT_HOUR &&
        minutes === this.LAST_APPOINTMENT_MINUTE &&
        seconds > 0);

    // Jika salah satu kondisi benar, lempar error
    if (isBeforeStart || isAfterEnd || isAfterLastAppointment) {
      throw new BadRequestException(
        `Jam janji harus antara ${this.WORKING_HOURS_START}:00 - ${this.LAST_APPOINTMENT_HOUR}:${this.LAST_APPOINTMENT_MINUTE}`,
      );
    }

    // Jika lolos semua (misal 16:30:00 atau 08:00:00), maka tidak melempar error
  }

  /**
   * Format time string dari Date object
   */
  formatTimeString(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  /**
   * Hitung buffer time window untuk conflict detection
   */
  calculateBufferWindow(
    tanggalJanji: Date,
    jamJanji: string,
    bufferMinutes: number = 30,
  ): { bufferStart: string; bufferEnd: string; appointmentDateTime: Date } {
    const [hours, minutes, seconds = 0] = jamJanji.split(':').map(Number);

    const appointmentDateTime = new Date(tanggalJanji);
    appointmentDateTime.setHours(hours, minutes, seconds, 0);

    const bufferStartDate = new Date(
      appointmentDateTime.getTime() - bufferMinutes * 60 * 1000,
    );
    const bufferEndDate = new Date(
      appointmentDateTime.getTime() + bufferMinutes * 60 * 1000,
    );

    return {
      bufferStart: this.formatTimeString(bufferStartDate),
      bufferEnd: this.formatTimeString(bufferEndDate),
      appointmentDateTime,
    };
  }

  /**
   * Cek apakah dua waktu memiliki konflik
   */
  hasTimeConflict(
    time1: string,
    time2: string,
    bufferMinutes: number = 30,
  ): boolean {
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);

    const minutes1 = h1 * 60 + m1;
    const minutes2 = h2 * 60 + m2;

    const diff = Math.abs(minutes1 - minutes2);

    return diff < bufferMinutes;
  }

  /**
   * Validasi komprehensif untuk create appointment
   */
  validateAppointmentTime(tanggalJanji: string | Date, jamJanji: string): void {
    // --- PERBAIKAN ---
    // Selalu konversi input menjadi objek Date yang valid
    // sebelum meneruskannya ke validator lain.
    const appointmentDate = new Date(tanggalJanji);

    // Periksa apakah konversi tanggal berhasil (jika string-nya tidak valid)
    if (isNaN(appointmentDate.getTime())) {
      throw new BadRequestException('Format tanggal janji temu tidak valid');
    }

    // Sekarang teruskan objek 'appointmentDate' yang sudah pasti
    this.validateDateNotInPast(appointmentDate);
    // ------------------

    this.validateWorkingHours(jamJanji);
  }
}
