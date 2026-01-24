export enum EmailType {
  // Authentication
  OTP_VERIFICATION = 'otp_verification',
  PASSWORD_RESET = 'password_reset',
  PASSWORD_CHANGED = 'password_changed',
  ACCOUNT_CREATED = 'account_created',

  // Appointment
  APPOINTMENT_REMINDER = 'appointment_reminder',
  APPOINTMENT_CONFIRMATION = 'appointment_confirmation',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',

  // Payment
  PAYMENT_CONFIRMED = 'payment_confirmed',
  PAYMENT_CANCELLED = 'payment_cancelled',
  PAYMENT_PENDING = 'payment_pending',

  // Medical Record
  MEDICAL_RECORD_READY = 'medical_record_ready',
}

export interface BaseEmailData {
  to: string;
  subject: string;
}

export interface OTPEmailData extends BaseEmailData {
  name: string;
  otpCode: string;
  expiresInMinutes: number;
}

export interface PasswordResetEmailData extends BaseEmailData {
  name: string;
  resetLink: string;
  expiresInMinutes: number;
}

export interface AppointmentReminderEmailData extends BaseEmailData {
  patientName: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  complaint?: string;
}

export interface PaymentEmailData extends BaseEmailData {
  patientName: string;
  invoiceNumber: string;
  amount: number;
  paymentMethod?: string;
  paidAt?: Date;
  cancelledAt?: Date;
  reason?: string;
}
