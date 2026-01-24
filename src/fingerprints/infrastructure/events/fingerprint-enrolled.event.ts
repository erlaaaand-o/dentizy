import { Fingerprint } from '../../domains/entities/fingerprint.entity';
import { Patient } from '../../../patients/domains/entities/patient.entity';

export class FingerprintEnrolledEvent {
  constructor(
    public readonly fingerprint: Fingerprint,
    public readonly patient: Patient,
  ) {}

  get eventName(): string {
    return 'fingerprint.enrolled';
  }

  get payload() {
    return {
      fingerprintId: this.fingerprint.id,
      patientId: this.patient.id,
      patientName: this.patient.nama_lengkap,
      fingerPosition: this.fingerprint.finger_position,
      quality: this.fingerprint.quality,
      deviceId: this.fingerprint.device_id,
      enrolledAt: this.fingerprint.created_at,
    };
  }
}
