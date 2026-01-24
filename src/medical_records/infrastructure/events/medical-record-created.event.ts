// backend/src/medical-records/domains/events/medical-record-created.event.ts

/**
 * Interface untuk Metadata
 */
export interface MedicalRecordMetadata {
  hasSubjektif: boolean;
  hasObjektif: boolean;
  hasAssessment: boolean;
  hasPlan: boolean;
  isComplete: boolean;
}

/**
 * Interface untuk struktur JSON event saat diserialisasi.
 */
export interface MedicalRecordCreatedEventJson {
  eventName: string;
  eventVersion: string;
  medicalRecordId: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  createdBy: string;
  timestamp: string; // Serialized Date is string
  metadata?: MedicalRecordMetadata;
}

/**
 * Domain Event: Medical Record Created
 * Triggered when a new medical record is created
 */
export class MedicalRecordCreatedEvent {
  constructor(
    public readonly medicalRecordId: string,
    public readonly appointmentId: string,
    public readonly patientId: string,
    public readonly doctorId: string,
    public readonly createdBy: string,
    public readonly timestamp: Date = new Date(),
    public readonly metadata?: MedicalRecordMetadata,
  ) {}

  /**
   * Get event name for logging/routing
   */
  static get eventName(): string {
    return 'medical_record.created';
  }

  /**
   * Get event version for event sourcing
   */
  static get eventVersion(): string {
    return '1.0.0';
  }

  /**
   * Serialize event to JSON
   * Mengembalikan interface spesifik, bukan Record<string, any>
   */
  toJSON(): MedicalRecordCreatedEventJson {
    return {
      eventName: MedicalRecordCreatedEvent.eventName,
      eventVersion: MedicalRecordCreatedEvent.eventVersion,
      medicalRecordId: this.medicalRecordId,
      appointmentId: this.appointmentId,
      patientId: this.patientId,
      doctorId: this.doctorId,
      createdBy: this.createdBy,
      timestamp: this.timestamp.toISOString(),
      metadata: this.metadata,
    };
  }

  /**
   * Create event from JSON
   * Menggunakan 'unknown' untuk input yang tidak dipercaya,
   * lalu divalidasi dengan Type Guard.
   */
  static fromJSON(json: unknown): MedicalRecordCreatedEvent {
    if (!this.isValidJson(json)) {
      throw new Error('Invalid JSON structure for MedicalRecordCreatedEvent');
    }

    return new MedicalRecordCreatedEvent(
      json.medicalRecordId,
      json.appointmentId,
      json.patientId,
      json.doctorId,
      json.createdBy,
      new Date(json.timestamp),
      json.metadata,
    );
  }

  /**
   * Type Guard untuk memvalidasi runtime JSON
   * Memastikan data yang masuk sesuai dengan kontrak MedicalRecordCreatedEventJson
   */
  private static isValidJson(
    data: unknown,
  ): data is MedicalRecordCreatedEventJson {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const record = data as Record<string, unknown>;

    return (
      typeof record.medicalRecordId === 'number' &&
      typeof record.appointmentId === 'number' &&
      typeof record.patientId === 'number' &&
      typeof record.doctorId === 'number' &&
      typeof record.createdBy === 'number' &&
      typeof record.timestamp === 'string' &&
      // Metadata opsional, tapi jika ada harus berupa object
      (record.metadata === undefined || typeof record.metadata === 'object')
    );
  }

  /**
   * Get human-readable description
   */
  getDescription(): string {
    return `Medical record #${this.medicalRecordId} created for patient #${this.patientId} by doctor #${this.doctorId}`;
  }
}
