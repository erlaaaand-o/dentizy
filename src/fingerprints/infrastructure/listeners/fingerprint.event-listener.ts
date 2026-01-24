import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { FingerprintCacheService } from '../cache/fingerprint-cache.service';
import { FingerprintEnrolledEvent } from '../events/fingerprint-enrolled.event';
import { FingerprintFailedEvent } from '../events/fingerprint-failed.event';
import { FingerprintVerifiedEvent } from '../events/fingerprint-verified.event';
import { FingerprintIoTService } from '../iot/fingerprint-iot.service';

@Injectable()
export class FingerprintEventListener {
  private readonly logger = new Logger(FingerprintEventListener.name);

  constructor(
    private readonly cacheService: FingerprintCacheService,
    private readonly iotService: FingerprintIoTService,
  ) {}

  @OnEvent('fingerprint.enrolled')
  async handleFingerprintEnrolled(event: FingerprintEnrolledEvent) {
    this.logger.log(
      `📢 Event: Fingerprint enrolled - Patient #${event.patient.id} (${event.fingerprint.finger_position})`,
    );

    try {
      // Invalidate cache for this patient
      await this.cacheService.invalidatePatientCache(event.patient.id);

      // Send notification via IoT/WebSocket
      await this.iotService.notifyEnrollment(event.payload);

      // Log audit trail
      this.logger.log(`✅ Fingerprint enrollment event processed successfully`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to process fingerprint enrollment event:`,
        error,
      );
    }
  }

  @OnEvent('fingerprint.verified')
  async handleFingerprintVerified(event: FingerprintVerifiedEvent) {
    this.logger.log(
      `📢 Event: Fingerprint verified - Patient #${event.patient.id} (score: ${event.matchScore})`,
    );

    try {
      // Update cache with verification data
      await this.cacheService.cacheVerification(
        event.fingerprint.id,
        event.matchScore,
      );

      // Send real-time notification
      await this.iotService.notifyVerification(event.payload);

      // Update statistics
      this.logger.log(
        `✅ Fingerprint verification event processed successfully`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to process fingerprint verification event:`,
        error,
      );
    }
  }

  @OnEvent('fingerprint.failed')
  async handleFingerprintFailed(event: FingerprintFailedEvent) {
    this.logger.warn(
      `📢 Event: Fingerprint verification failed - ${event.reason}`,
    );

    try {
      // Send failure notification
      await this.iotService.notifyFailure(event.payload);

      // Log security event if multiple failures
      this.logger.warn(`⚠️ Fingerprint verification failed: ${event.reason}`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to process fingerprint failure event:`,
        error,
      );
    }
  }
}
