// backend/src/treatments/applications/use-cases/delete-treatment.use-case.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TreatmentRepository } from '../../infrastructures/persistence/repositories/treatment.repository';
import { TreatmentBusinessService } from '../../domains/services/treatment-business.service';
import { TreatmentDeletedEvent } from '../../infrastructures/events/treatment-deleted.event';

@Injectable()
export class DeleteTreatmentUseCase {
  constructor(
    private readonly treatmentRepository: TreatmentRepository,
    private readonly businessService: TreatmentBusinessService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(id: string): Promise<void> {
    const treatment = await this.treatmentRepository.findOne(id);
    if (!treatment) {
      throw new NotFoundException(`Perawatan dengan ID ${id} tidak ditemukan`);
    }

    const canDelete = this.businessService.canBeDeleted(treatment);
    if (!canDelete.allowed) {
      throw new ConflictException(canDelete.reason);
    }

    await this.treatmentRepository.softDelete(id);

    this.eventEmitter.emit(
      'treatment.deleted',
      new TreatmentDeletedEvent(id, treatment.kodePerawatan, new Date()),
    );
  }
}
