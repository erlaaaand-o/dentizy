// backend/src/medical-records/domains/events/medical-record-deleted.event.ts

/**
 * Interface untuk Metadata penghapusan
 */
export interface MedicalRecordDeletedMetadata {
  recordAge: number; // days since creation
  wasComplete: boolean;
  appointmentStatus: string;
}

/**
 * Tipe literal untuk jenis penghapusan
 */
export type DeletionType = 'soft' | 'hard';

/**
 * Interface untuk struktur JSON event saat diserialisasi
 */
export interface MedicalRecordDeletedEventJson {
  eventName: string;
  eventVersion: string;
  medicalRecordId: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  deletedBy: string;
  timestamp: string; // Serialized Date
  deletionType: DeletionType;
  reason?: string;
  metadata?: MedicalRecordDeletedMetadata;
}

/**
 * Domain Event: Medical Record Deleted
 * Triggered when a medical record is soft-deleted or hard-deleted
 */
export class MedicalRecordDeletedEvent {
  constructor(
    public readonly medicalRecordId: string,
    public readonly appointmentId: string,
    public readonly patientId: string,
    public readonly doctorId: string,
    public readonly deletedBy: string,
    public readonly timestamp: Date = new Date(),
    public readonly deletionType: DeletionType = 'soft',
    public readonly reason?: string,
    public readonly metadata?: MedicalRecordDeletedMetadata,
  ) {}

  /**
   * Get event name for logging/routing
   */
  static get eventName(): string {
    return 'medical_record.deleted';
  }

  /**
   * Get event version for event sourcing
   */
  static get eventVersion(): string {
    return '1.0.0';
  }

  /**
   * Serialize event to JSON
   * Menggunakan interface spesifik alih-alih Record<string, any>
   */
  toJSON(): MedicalRecordDeletedEventJson {
    return {
      eventName: MedicalRecordDeletedEvent.eventName,
      eventVersion: MedicalRecordDeletedEvent.eventVersion,
      medicalRecordId: this.medicalRecordId,
      appointmentId: this.appointmentId,
      patientId: this.patientId,
      doctorId: this.doctorId,
      deletedBy: this.deletedBy,
      timestamp: this.timestamp.toISOString(),
      deletionType: this.deletionType,
      reason: this.reason,
      metadata: this.metadata,
    };
  }

  /**
   * Create event from JSON
   * Menerima input 'unknown' dan melakukan validasi ketat
   */
  static fromJSON(json: unknown): MedicalRecordDeletedEvent {
    if (!this.isValidJson(json)) {
      throw new Error('Invalid JSON structure for MedicalRecordDeletedEvent');
    }

    return new MedicalRecordDeletedEvent(
      json.medicalRecordId,
      json.appointmentId,
      json.patientId,
      json.doctorId,
      json.deletedBy,
      new Date(json.timestamp),
      json.deletionType,
      json.reason,
      json.metadata,
    );
  }

  /**
   * Type Guard untuk memvalidasi struktur JSON secara runtime
   */
  private static isValidJson(
    data: unknown,
  ): data is MedicalRecordDeletedEventJson {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const record = data as Record<string, unknown>;

    // Validasi field wajib
    const hasRequiredFields =
      typeof record.medicalRecordId === 'number' &&
      typeof record.appointmentId === 'number' &&
      typeof record.patientId === 'number' &&
      typeof record.doctorId === 'number' &&
      typeof record.deletedBy === 'number' &&
      typeof record.timestamp === 'string';

    if (!hasRequiredFields) return false;

    // Validasi DeletionType ('soft' atau 'hard')
    const isValidType =
      record.deletionType === 'soft' || record.deletionType === 'hard';
    if (!isValidType) return false;

    // Validasi field opsional: reason
    if (record.reason !== undefined && typeof record.reason !== 'string') {
      return false;
    }

    // Validasi field opsional: metadata
    if (record.metadata !== undefined) {
      if (typeof record.metadata !== 'object' || record.metadata === null) {
        return false;
      }
      // Opsional: Bisa ditambahkan pengecekan properti metadata lebih detail di sini jika perlu
    }

    return true;
  }

  /**
   * Get human-readable description
   */
  getDescription(): string {
    const type =
      this.deletionType === 'hard' ? 'permanently deleted' : 'deleted';
    const reasonPart = this.reason ? ` Reason: ${this.reason}` : '';
    return `Medical record #${this.medicalRecordId} ${type} by user #${this.deletedBy}.${reasonPart}`;
  }

  /**
   * Check if this is a permanent deletion
   */
  isPermanent(): boolean {
    return this.deletionType === 'hard';
  }

  /**
   * Check if record can be restored
   */
  isRestorable(): boolean {
    return this.deletionType === 'soft';
  }

  /**
   * Get severity level for logging
   */
  getSeverity(): 'info' | 'warning' | 'critical' {
    if (this.deletionType === 'hard') {
      return 'critical';
    }
    return this.metadata?.wasComplete ? 'warning' : 'info';
  }
}
