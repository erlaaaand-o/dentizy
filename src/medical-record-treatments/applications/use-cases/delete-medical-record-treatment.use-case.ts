// backend/src/medical-record-treatments/applications/use-cases/delete-medical-record-treatment.use-case.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MedicalRecordTreatmentRepository } from '../../infrastructures/persistence/repositories/medical-record-treatment.repository';
import { MedicalRecordTreatmentDeletedEvent } from '../../infrastructures/events/medical-record-treatment-deleted.event';

@Injectable()
export class DeleteMedicalRecordTreatmentUseCase {
  constructor(
    private readonly repository: MedicalRecordTreatmentRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(id: string): Promise<void> {
    const exists = await this.repository.findOne(id);
    if (!exists) {
      throw new NotFoundException(
        `Data perawatan rekam medis dengan ID ${id} tidak ditemukan`,
      );
    }

    await this.repository.softDelete(id);

    // Emit event
    this.eventEmitter.emit(
      'medical-record-treatment.deleted',
      new MedicalRecordTreatmentDeletedEvent(
        id,
        exists.medicalRecordId,
        new Date(),
      ),
    );
  }
}
