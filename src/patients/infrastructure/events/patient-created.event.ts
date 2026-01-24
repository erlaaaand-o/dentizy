import { Patient } from '../../domains/entities/patient.entity';

export class PatientCreatedEvent {
  constructor(public readonly patient: Patient) {}
}
