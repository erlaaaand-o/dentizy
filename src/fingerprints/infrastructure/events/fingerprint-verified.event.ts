import { Fingerprint } from '../../domains/entities/fingerprint.entity';
import { Patient } from '../../../patients/domains/entities/patient.entity';

export class FingerprintVerifiedEvent {
  constructor(
    public readonly fingerprint: Fingerprint,
    public readonly patient: Patient,
    public readonly matchScore: number,
  ) {}

  get eventName(): string {
    return 'fingerprint.verified';
  }

  get payload() {
    return {
      fingerprintId: this.fingerprint.id,
      patientId: this.patient.id,
      patientName: this.patient.nama_lengkap,
      medicalRecordNumber: this.patient.nomor_rekam_medis,
      fingerPosition: this.fingerprint.finger_position,
      matchScore: this.matchScore,
      verifiedAt: new Date(),
      verificationCount: this.fingerprint.verification_count,
    };
  }
}
