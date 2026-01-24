// backend/src/medical-records/domains/events/medical-record-updated.event.ts

/**
 * Interface untuk struktur perubahan nilai (old vs new)
 */
export interface FieldChange {
  old: string;
  new: string;
}

/**
 * Interface untuk menampung perubahan pada field spesifik
 */
export interface MedicalRecordChanges {
  subjektif?: FieldChange;
  objektif?: FieldChange;
  assessment?: FieldChange;
  plan?: FieldChange;
}

/**
 * Interface untuk Metadata update
 */
export interface MedicalRecordUpdatedMetadata {
  fieldsUpdated: string[];
  isNowComplete: boolean;
  wasComplete: boolean;
}

/**
 * Interface untuk struktur JSON event saat diserialisasi
 */
export interface MedicalRecordUpdatedEventJson {
  eventName: string;
  eventVersion: string;
  medicalRecordId: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  updatedBy: string;
  timestamp: string; // Serialized Date
  changes?: MedicalRecordChanges;
  metadata?: MedicalRecordUpdatedMetadata;
}

/**
 * Domain Event: Medical Record Updated
 * Triggered when a medical record is updated
 */
export class MedicalRecordUpdatedEvent {
  constructor(
    public readonly medicalRecordId: string,
    public readonly appointmentId: string,
    public readonly patientId: string,
    public readonly doctorId: string,
    public readonly updatedBy: string,
    public readonly timestamp: Date = new Date(),
    public readonly changes?: MedicalRecordChanges,
    public readonly metadata?: MedicalRecordUpdatedMetadata,
  ) {}

  /**
   * Get event name for logging/routing
   */
  static get eventName(): string {
    return 'medical_record.updated';
  }

  /**
   * Get event version for event sourcing
   */
  static get eventVersion(): string {
    return '1.0.0';
  }

  /**
   * Serialize event to JSON
   */
  toJSON(): MedicalRecordUpdatedEventJson {
    return {
      eventName: MedicalRecordUpdatedEvent.eventName,
      eventVersion: MedicalRecordUpdatedEvent.eventVersion,
      medicalRecordId: this.medicalRecordId,
      appointmentId: this.appointmentId,
      patientId: this.patientId,
      doctorId: this.doctorId,
      updatedBy: this.updatedBy,
      timestamp: this.timestamp.toISOString(),
      changes: this.changes,
      metadata: this.metadata,
    };
  }

  /**
   * Create event from JSON
   * Menggunakan 'unknown' untuk keamanan tipe data input
   */
  static fromJSON(json: unknown): MedicalRecordUpdatedEvent {
    if (!this.isValidJson(json)) {
      throw new Error('Invalid JSON structure for MedicalRecordUpdatedEvent');
    }

    return new MedicalRecordUpdatedEvent(
      json.medicalRecordId,
      json.appointmentId,
      json.patientId,
      json.doctorId,
      json.updatedBy,
      new Date(json.timestamp),
      json.changes,
      json.metadata,
    );
  }

  /**
   * Type Guard untuk memvalidasi struktur JSON secara runtime
   */
  private static isValidJson(
    data: unknown,
  ): data is MedicalRecordUpdatedEventJson {
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
      typeof record.updatedBy === 'number' &&
      typeof record.timestamp === 'string';

    if (!hasRequiredFields) return false;

    // Validasi field opsional: changes
    if (record.changes !== undefined) {
      if (typeof record.changes !== 'object' || record.changes === null) {
        return false;
      }
      // Kita bisa menambahkan validasi lebih dalam untuk struktur changes jika diperlukan
    }

    // Validasi field opsional: metadata
    if (record.metadata !== undefined) {
      if (typeof record.metadata !== 'object' || record.metadata === null) {
        return false;
      }
      // Validasi struktur metadata jika ada
      const meta = record.metadata as Record<string, unknown>;
      if (
        meta.fieldsUpdated !== undefined &&
        !Array.isArray(meta.fieldsUpdated)
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get human-readable description
   */
  getDescription(): string {
    const fieldsUpdated =
      this.metadata?.fieldsUpdated?.join(', ') || 'unknown fields';
    return `Medical record #${this.medicalRecordId} updated by user #${this.updatedBy}. Updated fields: ${fieldsUpdated}`;
  }

  /**
   * Check if specific field was updated
   */
  wasFieldUpdated(fieldName: string): boolean {
    return this.metadata?.fieldsUpdated?.includes(fieldName) || false;
  }

  /**
   * Get count of updated fields
   */
  getUpdatedFieldsCount(): number {
    return this.metadata?.fieldsUpdated?.length || 0;
  }
}
