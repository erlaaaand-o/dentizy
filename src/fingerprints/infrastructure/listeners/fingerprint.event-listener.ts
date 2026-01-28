import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { FingerprintCacheService } from '../cache/fingerprint-cache.service';
import { FingerprintEnrolledEvent } from '../events/fingerprint-enrolled.event';
import { FingerprintFailedEvent } from '../events/fingerprint-failed.event';
import { FingerprintVerifiedEvent } from '../events/fingerprint-verified.event';
import {
  FingerprintIoTService,
  EnrollmentPayload,
  VerificationPayload,
  FailurePayload,
} from '../iot/fingerprint-iot.service';

@Injectable()
export class FingerprintEventListener {
  private readonly logger = new Logger(FingerprintEventListener.name);

  constructor(
    private readonly cacheService: FingerprintCacheService,
    private readonly iotService: FingerprintIoTService,
  ) {}

  @OnEvent('fingerprint.enrolled')
  async handleFingerprintEnrolled(
    event: FingerprintEnrolledEvent,
  ): Promise<void> {
    this.logger.log(
      `📢 Event: Fingerprint enrolled - Patient #${event.patient.id} (${event.fingerprint.finger_position})`,
    );

    try {
      // Invalidate cache for this patient
      await this.cacheService.invalidatePatientCache(event.patient.id);

      // Mapping eksplisit ke EnrollmentPayload agar type-safe
      const payload: EnrollmentPayload = {
        ...event.payload,
        patientId: event.patient.id,
        fingerPosition: event.fingerprint.finger_position,
        status: 'success',
      };

      // Send notification via IoT/WebSocket
      await this.iotService.notifyEnrollment(payload);

      // Log audit trail
      this.logger.log(`✅ Fingerprint enrollment event processed successfully`);
    } catch (error) {
      this.handleError('fingerprint enrollment', error);
    }
  }

  @OnEvent('fingerprint.verified')
  async handleFingerprintVerified(
    event: FingerprintVerifiedEvent,
  ): Promise<void> {
    this.logger.log(
      `📢 Event: Fingerprint verified - Patient #${event.patient.id} (score: ${event.matchScore})`,
    );

    try {
      // Update cache with verification data
      await this.cacheService.cacheVerification(
        event.fingerprint.id,
        event.matchScore,
      );

      // Mapping eksplisit ke VerificationPayload
      const payload: VerificationPayload = {
        ...event.payload,
        patientId: event.patient.id,
        score: event.matchScore,
        match: true,
      };

      // Send real-time notification
      await this.iotService.notifyVerification(payload);

      // Update statistics
      this.logger.log(
        `✅ Fingerprint verification event processed successfully`,
      );
    } catch (error) {
      this.handleError('fingerprint verification', error);
    }
  }

  @OnEvent('fingerprint.failed')
  async handleFingerprintFailed(event: FingerprintFailedEvent): Promise<void> {
    this.logger.warn(
      `📢 Event: Fingerprint verification failed - ${event.reason}`,
    );

    try {
      // PERBAIKAN UTAMA: Mapping ke FailurePayload
      // Mengisi properti wajib: errorCode dan message
      const payload: FailurePayload = {
        errorCode: 'VERIFICATION_FAILED', // Kode standar aplikasi
        message: event.reason,
        // Menyertakan data detail dari event
        // (patientId, attemptedAt, templateLength, dll)
        ...event.payload,
        // Pastikan patientId dikonversi ke string jika di event dia number/undefined
        patientId: event.payload.patientId
          ? String(event.payload.patientId)
          : undefined,
      };

      // Send failure notification
      await this.iotService.notifyFailure(payload);

      // Log security event if multiple failures
      this.logger.warn(`⚠️ Fingerprint verification failed: ${event.reason}`);
    } catch (error) {
      this.handleError('fingerprint failure', error);
    }
  }

  // Helper untuk error handling yang bersih dan type-safe
  private handleError(context: string, error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    this.logger.error(`❌ Failed to process ${context} event:`, message);
  }
}
