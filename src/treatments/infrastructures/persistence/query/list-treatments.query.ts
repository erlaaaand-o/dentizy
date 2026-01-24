// backend/src/treatments/infrastructures/persistence/queries/list-treatments.query.ts
import { QueryTreatmentDto } from '../../../applications/dto/query-treatment.dto';

export class ListTreatmentsQuery {
  constructor(public readonly filters: QueryTreatmentDto) {}
}
